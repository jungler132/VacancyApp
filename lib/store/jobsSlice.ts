import { createAction, createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit';

import { searchJobs } from '@/lib/api/aggregator';
import { fetchHeadHunterDetails, hhVacancyId, isHhJobId } from '@/lib/api/providers/hh';
import { isAbortError } from '@/lib/api/errors';
import { feedLog } from '@/lib/feedLog';
import { makeFeedKey } from '@/lib/feedKey';
import { compareJobsByDate } from '@/lib/freshness';
import type { CategoryId, Job, RegionId, SourceError } from '@/lib/types';

export { makeFeedKey } from '@/lib/feedKey';

export const CACHE_TTL_MS = 10 * 60 * 1000;
const MAX_FEEDS = 18;

export type FeedStatus = 'idle' | 'loading' | 'refreshing' | 'loadingMore' | 'ready' | 'error';

export type FeedCache = {
  ids: string[];
  page: number;
  hasMore: boolean;
  exhaustedSources: string[];
  errors: SourceError[];
  fetchedAt: number;
  status: FeedStatus;
  requestId?: string;
  replacePending?: boolean;
};

export type FetchFeedArgs = {
  query: string;
  region: RegionId;
  category: CategoryId;
  enabledSources: string[];
  page: number;
  mode: 'replace' | 'append' | 'refresh';
};

export type FeedBatchPayload = {
  key: string;
  requestId: string;
  mode: FetchFeedArgs['mode'];
  jobs: Job[];
  error?: SourceError;
  exhausted?: boolean;
  pageFull?: boolean;
  sourceId?: string;
};

export function shouldFetchFeed(
  feed: FeedCache | undefined,
  mode: FetchFeedArgs['mode'],
  now = Date.now(),
): boolean {
  if (!feed) return true;
  if (mode === 'refresh') return feed.status !== 'refreshing';
  if (feed.status === 'loading' || feed.status === 'loadingMore' || feed.status === 'refreshing') return false;
  if (mode === 'append') return feed.hasMore && feed.status === 'ready';
  if (feed.ids.length === 0) {
    return feed.status === 'idle' || feed.status === 'error' || now - feed.fetchedAt >= CACHE_TTL_MS;
  }
  return now - feed.fetchedAt >= CACHE_TTL_MS;
}

export type JobsState = {
  byId: Record<string, Job>;
  feeds: Record<string, FeedCache>;
  lru: string[];
  viewedId?: string;
  todayIds: string[];
  worklyPublicIds: string[];
};

const initialState: JobsState = {
  byId: {},
  feeds: {},
  lru: [],
  todayIds: [],
  worklyPublicIds: [],
};

function sameJob(prev: Job, next: Job) {
  return (
    prev.title === next.title &&
    prev.company === next.company &&
    prev.location === next.location &&
    prev.cityId === next.cityId &&
    prev.remote === next.remote &&
    prev.salary === next.salary &&
    prev.publishedAt === next.publishedAt &&
    prev.url === next.url &&
    prev.excerpt === next.excerpt &&
    prev.companyLogo === next.companyLogo
  );
}

function upsertJobs(state: JobsState, jobs: Job[], keepExisting = false) {
  for (const job of jobs) {
    const prev = state.byId[job.id];
    if (prev && keepExisting) continue;
    if (prev && sameJob(prev, job)) continue;
    state.byId[job.id] = prev ? { ...prev, ...job } : job;
  }
}

function touchLru(state: JobsState, key: string) {
  state.lru = [key, ...state.lru.filter((item) => item !== key)].slice(0, MAX_FEEDS);
  const keep = new Set(state.lru);
  for (const feedKey of Object.keys(state.feeds)) {
    if (!keep.has(feedKey)) delete state.feeds[feedKey];
  }
}

function pruneById(state: JobsState, extraKeep: string[] = []) {
  const keep = new Set(extraKeep);
  if (state.viewedId) keep.add(state.viewedId);
  for (const id of state.todayIds) keep.add(id);
  for (const id of state.worklyPublicIds) keep.add(id);
  for (const feed of Object.values(state.feeds)) {
    for (const id of feed.ids) keep.add(id);
  }
  for (const [id, job] of Object.entries(state.byId)) {
    if (job.description) keep.add(id);
  }
  for (const id of Object.keys(state.byId)) {
    if (!keep.has(id)) delete state.byId[id];
  }
}

function mergeExhausted(prev: string[] | undefined, next: string[]): string[] {
  if (!prev?.length) return next;
  const seen = new Set(prev);
  const out = [...prev];
  for (const id of next) {
    if (seen.has(id)) continue;
    seen.add(id);
    out.push(id);
  }
  return out;
}

function sortFeedIds(state: JobsState, feed: FeedCache) {
  feed.ids.sort((a, b) => {
    const left = state.byId[a];
    const right = state.byId[b];
    if (!left || !right) return 0;
    return compareJobsByDate(left, right);
  });
}

export const ingestFeedBatch = createAction<FeedBatchPayload>('jobs/ingestFeedBatch');

export const fetchFeed = createAsyncThunk(
  'jobs/fetchFeed',
  async (args: FetchFeedArgs, { signal, getState, dispatch, requestId }) => {
    const jobsState = (getState() as { jobs: JobsState }).jobs;
    const key = makeFeedKey(args.query, args.region, args.category, args.enabledSources);
    feedLog('fetch', {
      id: requestId.slice(0, 8),
      mode: args.mode,
      region: args.region,
      category: args.category,
      query: args.query.trim() || '-',
      page: args.page,
      sources: args.enabledSources,
    });
    const exhausted = args.mode === 'append' ? jobsState.feeds[key]?.exhaustedSources : undefined;
    const result = await searchJobs(
      {
        query: args.query,
        region: args.region,
        category: args.category,
        enabledSources: args.enabledSources,
        page: args.page,
        exhaustedSources: exhausted,
        signal,
        bypassCache: args.mode === 'refresh',
      },
      undefined,
      (batch) => {
        if (signal.aborted) return;
        dispatch(
          ingestFeedBatch({
            key,
            requestId,
            mode: args.mode,
            jobs: batch.jobs,
            error: batch.error,
            exhausted: batch.exhausted,
            pageFull: batch.pageFull,
            sourceId: batch.sourceId,
          }),
        );
      },
    );
    if (signal.aborted) {
      feedLog('fetch:abort', { id: requestId.slice(0, 8), mode: args.mode });
      const error = new Error('aborted');
      error.name = 'AbortError';
      throw error;
    }
    feedLog('fetch:done', {
      id: requestId.slice(0, 8),
      mode: args.mode,
      jobs: result.jobs.length,
      errors: result.errors.length,
    });
    return {
      ...result,
      key,
      page: args.page,
      mode: args.mode,
    };
  },
  {
    condition: (args, { getState }) => {
      const state = (getState() as { jobs: JobsState }).jobs;
      const key = makeFeedKey(args.query, args.region, args.category, args.enabledSources);
      const feed = state.feeds[key];
      const ok = shouldFetchFeed(feed, args.mode);
      if (!ok) {
        feedLog('fetch:skip', {
          mode: args.mode,
          status: feed?.status ?? 'none',
          ids: feed?.ids.length ?? 0,
        });
      }
      return ok;
    },
  },
);

export const hydrateJob = createAsyncThunk('jobs/hydrateJob', async (id: string, { signal }) => {
  if (!isHhJobId(id)) return null;
  const details = await fetchHeadHunterDetails(hhVacancyId(id), signal);
  return { id, details };
});

const jobsSlice = createSlice({
  name: 'jobs',
  initialState,
  reducers: {
    rememberJobs(state, action: PayloadAction<Job[]>) {
      upsertJobs(state, action.payload);
    },
    setTodayJobs(state, action: PayloadAction<Job[]>) {
      upsertJobs(state, action.payload);
      state.todayIds = action.payload.map((job) => job.id);
    },
    setWorklyPublic(state, action: PayloadAction<Job[]>) {
      upsertJobs(state, action.payload);
      state.worklyPublicIds = action.payload.map((job) => job.id);
    },
    pinViewedJob(state, action: PayloadAction<Job>) {
      upsertJobs(state, [action.payload]);
      state.viewedId = action.payload.id;
    },
    pruneUnreferencedJobs(state, action: PayloadAction<string[]>) {
      pruneById(state, action.payload);
    },
    clearJobsCache(state) {
      state.feeds = {};
      state.lru = [];
    },
    dismissFeedErrors(state, action: PayloadAction<string>) {
      const feed = state.feeds[action.payload];
      if (feed) feed.errors = [];
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(ingestFeedBatch, (state, action) => {
        const { key, requestId, mode, jobs, error, exhausted, pageFull, sourceId } = action.payload;
        const feed = state.feeds[key];
        if (!feed || feed.requestId !== requestId) return;
        upsertJobs(state, jobs, mode === 'append');
        if (error) {
          if (!feed.errors.some((item) => item.sourceId === error.sourceId && item.message === error.message)) {
            feed.errors.push(error);
          }
        }
        if (exhausted && sourceId) feed.exhaustedSources = mergeExhausted(feed.exhaustedSources, [sourceId]);
        if (pageFull) feed.hasMore = true;
        if (!jobs.length) return;
        if (feed.replacePending) {
          feed.ids = [];
          feed.replacePending = false;
        }
        const seen = new Set(feed.ids);
        for (const job of jobs) {
          if (seen.has(job.id)) continue;
          seen.add(job.id);
          feed.ids.push(job.id);
        }
        sortFeedIds(state, feed);
      })
      .addCase(fetchFeed.pending, (state, action) => {
        const { query, region, category, enabledSources, mode } = action.meta.arg;
        const key = makeFeedKey(query, region, category, enabledSources);
        const current = state.feeds[key];
        const status: FeedStatus = mode === 'append' ? 'loadingMore' : mode === 'refresh' ? 'refreshing' : 'loading';
        state.feeds[key] = {
          ids: current?.ids ?? [],
          page: current?.page ?? 0,
          hasMore: current?.hasMore ?? true,
          exhaustedSources: mode === 'append' ? (current?.exhaustedSources ?? []) : [],
          errors: mode === 'append' ? (current?.errors ?? []) : [],
          fetchedAt: current?.fetchedAt ?? 0,
          status,
          requestId: action.meta.requestId,
          replacePending: mode !== 'append',
        };
        touchLru(state, key);
      })
      .addCase(fetchFeed.fulfilled, (state, action) => {
        const { key, jobs, errors, hasMore, exhaustedSources, page, mode } = action.payload;
        const current = state.feeds[key];
        if (!current || current.requestId !== action.meta.requestId) return;
        upsertJobs(state, jobs, mode === 'append');
        const prevIds = mode === 'append' ? (current.ids ?? []) : [];
        const seen = new Set(prevIds);
        const ids = [...prevIds];
        for (const job of jobs) {
          if (seen.has(job.id)) continue;
          seen.add(job.id);
          ids.push(job.id);
        }
        const added = ids.length - prevIds.length;
        state.feeds[key] = {
          ids,
          page,
          hasMore: mode === 'append' && added === 0 ? false : hasMore,
          exhaustedSources:
            mode === 'append' ? mergeExhausted(current.exhaustedSources, exhaustedSources) : exhaustedSources,
          errors,
          fetchedAt: Date.now(),
          status: ids.length === 0 && errors.length > 0 ? 'error' : 'ready',
          requestId: action.meta.requestId,
          replacePending: false,
        };
        touchLru(state, key);
      })
      .addCase(fetchFeed.rejected, (state, action) => {
        const { query, region, category, enabledSources } = action.meta.arg;
        const key = makeFeedKey(query, region, category, enabledSources);
        const current = state.feeds[key];
        if (!current || current.requestId !== action.meta.requestId) return;
        if (isAbortError(action.error)) {
          current.status = current.ids.length ? 'ready' : 'idle';
          current.replacePending = false;
          return;
        }
        current.errors = [
          {
            sourceId: 'app',
            sourceName: 'Workly',
            message: action.error.message ?? 'не удалось загрузить ленту',
          },
        ];
        current.status = current.ids.length ? 'ready' : 'error';
        current.replacePending = false;
      })
      .addCase(hydrateJob.fulfilled, (state, action) => {
        if (!action.payload) return;
        const prev = state.byId[action.payload.id];
        if (!prev) return;
        state.byId[action.payload.id] = { ...prev, ...action.payload.details };
      });
  },
});

export const {
  rememberJobs,
  setTodayJobs,
  setWorklyPublic,
  pinViewedJob,
  pruneUnreferencedJobs,
  clearJobsCache,
  dismissFeedErrors,
} = jobsSlice.actions;
export default jobsSlice.reducer;

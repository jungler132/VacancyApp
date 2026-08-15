import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit';

import { searchJobs } from '@/lib/api/aggregator';
import { fetchHeadHunterDetails, hhVacancyId, isHhJobId } from '@/lib/api/providers/hh';
import { isAbortError } from '@/lib/api/errors';
import type { CategoryId, Job, RegionId, SourceError } from '@/lib/types';

export const CACHE_TTL_MS = 10 * 60 * 1000;
const MAX_FEEDS = 18;

export type FeedStatus = 'idle' | 'loading' | 'refreshing' | 'loadingMore' | 'ready' | 'error';

export type FeedCache = {
  ids: string[];
  page: number;
  hasMore: boolean;
  errors: SourceError[];
  fetchedAt: number;
  status: FeedStatus;
};

export type JobsState = {
  byId: Record<string, Job>;
  feeds: Record<string, FeedCache>;
  lru: string[];
};

const initialState: JobsState = {
  byId: {},
  feeds: {},
  lru: [],
};

export function makeFeedKey(query: string, region: RegionId, category: CategoryId, sources: string[] = []): string {
  return `v6|${region}|${category}|${query.trim().toLowerCase()}|${[...sources].sort().join(',')}`;
}

function sameJob(prev: Job, next: Job) {
  return (
    prev.title === next.title &&
    prev.company === next.company &&
    prev.location === next.location &&
    prev.remote === next.remote &&
    prev.salary === next.salary &&
    prev.publishedAt === next.publishedAt &&
    prev.url === next.url &&
    prev.excerpt === next.excerpt
  );
}

function upsertJobs(state: JobsState, jobs: Job[]) {
  for (const job of jobs) {
    const prev = state.byId[job.id];
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

export const fetchFeed = createAsyncThunk(
  'jobs/fetchFeed',
  async (
    args: {
      query: string;
      region: RegionId;
      category: CategoryId;
      enabledSources: string[];
      page: number;
      mode: 'replace' | 'append' | 'refresh';
    },
    { signal },
  ) => {
    const result = await searchJobs({
      query: args.query,
      region: args.region,
      category: args.category,
      enabledSources: args.enabledSources,
      page: args.page,
      signal,
    });
    if (signal.aborted) {
      const error = new Error('aborted');
      error.name = 'AbortError';
      throw error;
    }
    return {
      ...result,
      key: makeFeedKey(args.query, args.region, args.category, args.enabledSources),
      page: args.page,
      mode: args.mode,
    };
  },
  {
    condition: (args, { getState }) => {
      const state = (getState() as { jobs: JobsState }).jobs;
      const key = makeFeedKey(args.query, args.region, args.category, args.enabledSources);
      const feed = state.feeds[key];
      if (!feed) return true;
      if (feed.status === 'loading' || feed.status === 'loadingMore' || feed.status === 'refreshing') return false;
      if (args.mode === 'refresh') return true;
      if (args.mode === 'append') return feed.hasMore && feed.status === 'ready';
      const fresh = Date.now() - feed.fetchedAt < CACHE_TTL_MS;
      return !(fresh && feed.ids.length > 0);
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
      .addCase(fetchFeed.pending, (state, action) => {
        const { query, region, category, enabledSources, mode } = action.meta.arg;
        const key = makeFeedKey(query, region, category, enabledSources);
        const current = state.feeds[key];
        const status: FeedStatus = mode === 'append' ? 'loadingMore' : mode === 'refresh' ? 'refreshing' : 'loading';
        state.feeds[key] = {
          ids: current?.ids ?? [],
          page: current?.page ?? 0,
          hasMore: current?.hasMore ?? true,
          errors: current?.errors ?? [],
          fetchedAt: current?.fetchedAt ?? 0,
          status,
        };
        touchLru(state, key);
      })
      .addCase(fetchFeed.fulfilled, (state, action) => {
        const { key, jobs, errors, hasMore, page, mode } = action.payload;
        upsertJobs(state, jobs);
        const current = state.feeds[key];
        const prevIds = mode === 'append' ? (current?.ids ?? []) : [];
        const seen = new Set(prevIds);
        const ids = [...prevIds];
        for (const job of jobs) {
          if (seen.has(job.id)) continue;
          seen.add(job.id);
          ids.push(job.id);
        }
        state.feeds[key] = {
          ids,
          page,
          hasMore,
          errors,
          fetchedAt: Date.now(),
          status: ids.length === 0 && errors.length > 0 ? 'error' : 'ready',
        };
        touchLru(state, key);
      })
      .addCase(fetchFeed.rejected, (state, action) => {
        const { query, region, category, enabledSources } = action.meta.arg;
        const key = makeFeedKey(query, region, category, enabledSources);
        const current = state.feeds[key];
        if (!current) return;
        if (isAbortError(action.error)) {
          current.status = current.ids.length ? 'ready' : 'loading';
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
      })
      .addCase(hydrateJob.fulfilled, (state, action) => {
        if (!action.payload) return;
        const prev = state.byId[action.payload.id];
        if (!prev) return;
        state.byId[action.payload.id] = { ...prev, ...action.payload.details };
      });
  },
});

export const { rememberJobs, clearJobsCache, dismissFeedErrors } = jobsSlice.actions;
export default jobsSlice.reducer;

import type { Job, RegionId, SearchParams, SearchResult, SourceError } from '../types';
import { jobMatchesAnyLang } from '../catalog';
import { describeSourceError, isAbortError } from './errors';
import { feedLog } from '../feedLog';
import { jobKey } from '../format';
import { compareJobsByDate, isFreshJob } from '../freshness';
import { SOURCES, enabledSourceIds } from './sources';
import { searchHeadHunter, searchHeadHunterAz } from './providers/hh';
import { searchBirJob } from './providers/birjob';
import { searchTrudvsem } from './providers/trudvsem';
import { searchArbeitnow } from './providers/arbeitnow';
import { searchRemotive } from './providers/remotive';
import { searchJobicy } from './providers/jobicy';
import { searchRemoteOK } from './providers/remoteok';
import { searchHimalayas } from './providers/himalayas';
import { searchAdzuna } from './providers/adzuna';
import { searchJooble } from './providers/jooble';
import { searchUsaJobs } from './providers/usajobs';
import { searchTheMuse } from './providers/themuse';
import { searchWorkingNomads } from './providers/workingnomads';

type Provider = {
  id: string;
  run: (params: SearchParams) => Promise<Job[]>;
  regions: Array<SearchParams['region'] | 'any'>;
  paginated?: boolean;
  pageSize?: number;
};

export type JobProvider = Provider;

export type SearchBatch = {
  sourceId: string;
  jobs: Job[];
  error?: SourceError;
  exhausted?: boolean;
  pageFull?: boolean;
};

export const DUMP_SOURCE_IDS = new Set(['remoteok', 'birjob', 'workingnomads', 'arbeitnow']);
const FAST_CONCURRENCY = 4;
const DUMP_CONCURRENCY = 2;

const PROVIDERS: Provider[] = [
  { id: 'hh', run: searchHeadHunter, regions: ['all', 'cis'], paginated: true, pageSize: 25 },
  { id: 'hhaz', run: searchHeadHunterAz, regions: ['az'], paginated: true, pageSize: 25 },
  { id: 'birjob', run: searchBirJob, regions: ['all', 'cis', 'az'] },
  { id: 'trudvsem', run: searchTrudvsem, regions: ['all', 'cis'], paginated: true, pageSize: 20 },
  { id: 'arbeitnow', run: searchArbeitnow, regions: ['all', 'europe', 'remote'] },
  { id: 'remotive', run: searchRemotive, regions: ['all', 'europe', 'west', 'asia', 'remote'] },
  { id: 'jobicy', run: searchJobicy, regions: ['all', 'europe', 'west', 'asia', 'remote'] },
  { id: 'remoteok', run: searchRemoteOK, regions: ['all', 'europe', 'west', 'asia', 'remote'] },
  { id: 'himalayas', run: searchHimalayas, regions: ['all', 'europe', 'west', 'asia', 'remote'] },
  { id: 'adzuna', run: searchAdzuna, regions: ['all', 'cis', 'europe', 'west', 'asia', 'remote'], paginated: true, pageSize: 20 },
  { id: 'jooble', run: searchJooble, regions: ['any'], paginated: true, pageSize: 20 },
  { id: 'usajobs', run: searchUsaJobs, regions: ['all', 'west', 'remote'] },
  { id: 'muse', run: searchTheMuse, regions: ['all', 'europe', 'west', 'asia', 'remote'], paginated: true, pageSize: 20 },
  { id: 'workingnomads', run: searchWorkingNomads, regions: ['all', 'europe', 'west', 'asia', 'remote'] },
];

export { SOURCES, availableSourceIds, enabledSourceIds } from './sources';

export function isDumpSource(id: string): boolean {
  return DUMP_SOURCE_IDS.has(id);
}

const FAST_PRIORITY: Partial<Record<RegionId, Record<string, number>>> = {
  az: { hhaz: 0, jooble: 1, hh: 2 },
  cis: { hh: 0, trudvsem: 1, jooble: 2, adzuna: 3 },
  all: { hh: 0, trudvsem: 1, remotive: 2, jobicy: 3, himalayas: 4, muse: 5, jooble: 6, adzuna: 7, usajobs: 8 },
  europe: { remotive: 0, jobicy: 1, himalayas: 2, muse: 3, adzuna: 4, jooble: 5 },
  west: { remotive: 0, usajobs: 1, muse: 2, adzuna: 3, jooble: 4, himalayas: 5, jobicy: 6 },
  asia: { remotive: 0, himalayas: 1, jobicy: 2, adzuna: 3, jooble: 4, muse: 5 },
  remote: { remotive: 0, jobicy: 1, himalayas: 2, muse: 3, usajobs: 4, jooble: 5 },
};

function fastPriority(id: string, region: RegionId): number {
  return FAST_PRIORITY[region]?.[id] ?? 40;
}

async function runPool<T>(
  items: T[],
  concurrency: number,
  worker: (item: T) => Promise<void>,
  signal?: AbortSignal,
): Promise<void> {
  if (!items.length) return;
  let index = 0;
  const run = async () => {
    while (index < items.length) {
      if (signal?.aborted) return;
      const current = items[index];
      index += 1;
      await worker(current);
    }
  };
  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, () => run()));
}

function acceptJobs(
  raw: Job[],
  params: SearchParams,
  seen: Set<string>,
): Job[] {
  const jobs: Job[] = [];
  for (const job of raw) {
    const hay = `${job.title} ${job.company} ${job.excerpt} ${job.category ?? ''}`;
    if (!jobMatchesAnyLang(hay, params.query, params.category)) continue;
    const key = jobKey(job.title, job.company);
    if (seen.has(key)) continue;
    if (!isFreshJob(job)) continue;
    seen.add(key);
    jobs.push(job);
  }
  return jobs;
}

function sourceName(id: string): string {
  return SOURCES.find((item) => item.id === id)?.name ?? id;
}

function abortError(): Error {
  return Object.assign(new Error('aborted'), { name: 'AbortError' });
}

function searchDedupeKey(params: SearchParams, list: JobProvider[]): string {
  return [
    params.region,
    params.category,
    params.query.trim().toLowerCase(),
    params.placeId ?? '',
    String(params.page),
    [...(params.enabledSources ?? [])].sort().join(','),
    [...(params.exhaustedSources ?? [])].sort().join(','),
    params.bypassCache ? '1' : '0',
    list.map((item) => item.id).join(','),
  ].join('|');
}

type InflightSearch = {
  promise: Promise<SearchResult>;
  batches: SearchBatch[];
  listeners: Set<(batch: SearchBatch) => void>;
  refs: number;
  abort: () => void;
};

const inflightSearches = new Map<string, InflightSearch>();

async function subscribeInflight(
  entry: InflightSearch,
  signal: AbortSignal | undefined,
  onBatch?: (batch: SearchBatch) => void,
): Promise<SearchResult> {
  entry.refs += 1;
  if (onBatch) {
    for (const batch of entry.batches) onBatch(batch);
    entry.listeners.add(onBatch);
  }
  let released = false;
  const release = () => {
    if (released) return;
    released = true;
    if (onBatch) entry.listeners.delete(onBatch);
    entry.refs -= 1;
    if (entry.refs <= 0) entry.abort();
  };
  if (signal?.aborted) {
    release();
    throw abortError();
  }
  const onAbort = () => release();
  signal?.addEventListener('abort', onAbort, { once: true });
  try {
    const result = await entry.promise;
    if (signal?.aborted) throw abortError();
    return result;
  } finally {
    signal?.removeEventListener('abort', onAbort);
    release();
  }
}

async function runSearchJobs(
  params: SearchParams,
  list: JobProvider[],
  onBatch?: (batch: SearchBatch) => void,
): Promise<SearchResult> {
  const enabled = new Set(params.enabledSources?.length ? params.enabledSources : enabledSourceIds());
  const exhausted = new Set(params.exhaustedSources ?? []);
  const selected = list.filter((provider) => {
    if (!enabled.has(provider.id)) return false;
    if (params.page > 0 && !provider.paginated) return false;
    if (exhausted.has(provider.id)) return false;
    return provider.regions.includes('any') || provider.regions.includes(params.region);
  });

  const fast = selected
    .filter((provider) => !isDumpSource(provider.id))
    .sort((a, b) => fastPriority(a.id, params.region) - fastPriority(b.id, params.region));
  const dumps = selected.filter((provider) => isDumpSource(provider.id));
  feedLog('search', {
    region: params.region,
    category: params.category,
    query: params.query.trim() || '-',
    page: params.page,
    bypass: params.bypassCache ? 1 : 0,
    fast: fast.map((item) => item.id),
    dumps: dumps.map((item) => item.id),
  });

  const jobs: Job[] = [];
  const errors: SourceError[] = [];
  const seen = new Set<string>();
  const nextExhausted: string[] = [];
  let hasMore = false;

  const runProvider = async (provider: Provider) => {
    if (params.signal?.aborted) {
      feedLog('abort', { source: provider.id });
      return;
    }
    const started = Date.now();
    feedLog('source:start', { source: provider.id, dump: isDumpSource(provider.id) ? 1 : 0 });
    try {
      const raw = await provider.run({ ...params, signal: params.signal });
      if (params.signal?.aborted) {
        feedLog('abort', { source: provider.id, ms: Date.now() - started });
        return;
      }
      let pageFull = false;
      let sourceExhausted = false;
      if (provider.paginated) {
        const pageSize = provider.pageSize ?? 20;
        if (raw.length >= pageSize) {
          hasMore = true;
          pageFull = true;
        } else {
          nextExhausted.push(provider.id);
          sourceExhausted = true;
        }
      }
      const accepted = acceptJobs(raw, params, seen);
      jobs.push(...accepted);
      feedLog('source:ok', {
        source: provider.id,
        ms: Date.now() - started,
        raw: raw.length,
        keep: accepted.length,
      });
      onBatch?.({
        sourceId: provider.id,
        jobs: accepted,
        exhausted: sourceExhausted || undefined,
        pageFull: pageFull || undefined,
      });
    } catch (reason) {
      const ms = Date.now() - started;
      if (isAbortError(reason) || params.signal?.aborted) {
        feedLog('source:abort', { source: provider.id, ms });
        return;
      }
      const message = describeSourceError(reason);
      if (message === 'отменено' || /код 410/.test(message)) {
        feedLog('source:skip', { source: provider.id, ms, reason: message });
        return;
      }
      const error = {
        sourceId: provider.id,
        sourceName: sourceName(provider.id),
        message,
      };
      feedLog('source:fail', { source: provider.id, ms, reason: message });
      errors.push(error);
      onBatch?.({ sourceId: provider.id, jobs: [], error });
    }
  };

  await runPool(fast, FAST_CONCURRENCY, runProvider, params.signal);
  if (!params.signal?.aborted) {
    await runPool(dumps, DUMP_CONCURRENCY, runProvider, params.signal);
  }

  jobs.sort(compareJobsByDate);
  feedLog('search:done', {
    jobs: jobs.length,
    errors: errors.length,
    hasMore: hasMore ? 1 : 0,
    exhausted: nextExhausted,
  });

  return {
    jobs,
    errors,
    hasMore,
    exhaustedSources: nextExhausted,
  };
}

export async function searchJobs(
  params: SearchParams,
  providers?: JobProvider[],
  onBatch?: (batch: SearchBatch) => void,
): Promise<SearchResult> {
  const list = providers ?? PROVIDERS;
  const key = searchDedupeKey(params, list);
  const existing = inflightSearches.get(key);
  if (existing) {
    feedLog('search:reuse', {
      region: params.region,
      category: params.category,
      query: params.query.trim() || '-',
      page: params.page,
    });
    return subscribeInflight(existing, params.signal, onBatch);
  }
  const controller = new AbortController();
  const entry: InflightSearch = {
    promise: Promise.resolve({ jobs: [], errors: [], hasMore: false, exhaustedSources: [] }),
    batches: [],
    listeners: new Set(),
    refs: 0,
    abort: () => {
      if (!controller.signal.aborted) controller.abort();
    },
  };
  inflightSearches.set(key, entry);
  entry.promise = runSearchJobs({ ...params, signal: controller.signal }, list, (batch) => {
    entry.batches.push(batch);
    for (const listener of entry.listeners) listener(batch);
  }).finally(() => {
    if (inflightSearches.get(key) === entry) inflightSearches.delete(key);
  });
  return subscribeInflight(entry, params.signal, onBatch);
}

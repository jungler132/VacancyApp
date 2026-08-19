import { MAX_JOBS } from './limits';
import { jobMatchesAnyLang, jobMatchesCategories, jobMatchesRegion, apiCategory } from './catalog';
import { DEFAULT_EXTRA_FILTERS, filterFeedIds, jobMatchesExtra, type ExtraFilters } from './filters';
import { compareJobsByDate } from './freshness';
import type { CategoryId, Job, JobTier, RegionId } from './types';

export const WORKLY_SOURCE_ID = 'workly';
export const LOCAL_JOBS_LIMIT = MAX_JOBS;

export type TierFilter = 'all' | JobTier;

export const TIER_FILTERS: { id: TierFilter; label: string }[] = [
  { id: 'all', label: 'Все' },
  { id: 1, label: 'Премиум' },
  { id: 2, label: 'Workly' },
  { id: 3, label: 'Площадки' },
];

export function jobTier(job: Pick<Job, 'tier' | 'sourceId'>): JobTier {
  if (job.tier === 1 || job.tier === 2 || job.tier === 3) return job.tier;
  return job.sourceId === WORKLY_SOURCE_ID ? 2 : 3;
}

export function isLocalJob(job: Pick<Job, 'sourceId' | 'id'>): boolean {
  return job.sourceId === WORKLY_SOURCE_ID || job.id.startsWith('workly:');
}

export function compareJobsByTierThenDate(a: Job, b: Job): number {
  const ta = jobTier(a);
  const tb = jobTier(b);
  if (ta !== tb) return ta - tb;
  return compareJobsByDate(a, b);
}

export function filterLocalJobs(
  jobs: Job[],
  opts: {
    query: string;
    region: RegionId;
    categories: CategoryId[];
    extra?: ExtraFilters | null;
    tierFilter: TierFilter;
  },
): Job[] {
  const extra = opts.extra ?? DEFAULT_EXTRA_FILTERS;
  const category = apiCategory(opts.categories);
  const out: Job[] = [];
  for (const job of jobs) {
    if (opts.tierFilter !== 'all' && jobTier(job) !== opts.tierFilter) continue;
    if (!jobMatchesExtra(job, extra)) continue;
    const hay = `${job.title} ${job.company} ${job.excerpt} ${job.description ?? ''} ${job.category ?? ''}`;
    if (opts.query.trim() && !jobMatchesAnyLang(hay, opts.query)) continue;
    if (category !== 'all' && !jobMatchesAnyLang(hay, '', category)) continue;
    if (opts.categories.filter((id) => id !== 'all').length > 1 && !jobMatchesCategories(hay, opts.categories)) {
      continue;
    }
    if (opts.region !== 'all' && job.location && !jobMatchesRegion(job.location, opts.region, job.remote)) continue;
    out.push(job);
  }
  return out;
}

export function mergeVisibleIds(
  feedIds: string[],
  localJobs: Job[],
  byId: Record<string, Job>,
  opts: {
    query: string;
    region: RegionId;
    categories: CategoryId[];
    extra?: ExtraFilters | null;
    tierFilter: TierFilter;
  },
): string[] {
  const locals = filterLocalJobs(localJobs, opts).sort(compareJobsByTierThenDate);
  const feedIdsFiltered =
    opts.tierFilter === 1 || opts.tierFilter === 2
      ? []
      : filterFeedIds(feedIds, byId, opts.categories, opts.extra);
  const seen = new Set<string>();
  const ids: string[] = [];
  for (const job of locals) {
    if (seen.has(job.id)) continue;
    seen.add(job.id);
    ids.push(job.id);
  }
  for (const id of feedIdsFiltered) {
    if (seen.has(id)) continue;
    if (!byId[id]) continue;
    seen.add(id);
    ids.push(id);
  }
  return ids;
}

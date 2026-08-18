import { jobMatchesCategories } from './catalog';
import { MAX_JOB_AGE_DAYS, isFreshJob } from './freshness';
import type { CategoryId, Job } from './types';

export type WorkFormat = 'any' | 'remote' | 'office';
export type EmploymentFilter = 'any' | 'full' | 'part' | 'shift';
export type AgeFilter = 7 | 30 | 90;

export type ExtraFilters = {
  format: WorkFormat;
  employment: EmploymentFilter;
  maxAgeDays: AgeFilter;
};

export const DEFAULT_EXTRA_FILTERS: ExtraFilters = {
  format: 'any',
  employment: 'any',
  maxAgeDays: MAX_JOB_AGE_DAYS,
};

export const AGE_PRESETS: AgeFilter[] = [7, 30, 90];

const FORMATS: WorkFormat[] = ['any', 'remote', 'office'];
const EMPLOYMENTS: EmploymentFilter[] = ['any', 'full', 'part', 'shift'];

export function parseAgeFilter(value: unknown): AgeFilter {
  if (value === 7 || value === 30 || value === 90) return value;
  if (value === 3) return 7;
  if (value === 14) return 30;
  return DEFAULT_EXTRA_FILTERS.maxAgeDays;
}

export function parseExtraFilters(value: unknown): ExtraFilters {
  const row = value && typeof value === 'object' ? (value as Partial<ExtraFilters>) : {};
  return {
    format: FORMATS.includes(row.format as WorkFormat) ? (row.format as WorkFormat) : 'any',
    employment: EMPLOYMENTS.includes(row.employment as EmploymentFilter)
      ? (row.employment as EmploymentFilter)
      : 'any',
    maxAgeDays: parseAgeFilter(row.maxAgeDays),
  };
}

export function extraFiltersActive(filters?: ExtraFilters | null): boolean {
  if (!filters) return false;
  return filters.format !== 'any' || filters.employment !== 'any' || filters.maxAgeDays !== MAX_JOB_AGE_DAYS;
}

export function jobMatchesExtra(job: Job, filters: ExtraFilters): boolean {
  if (!isFreshJob(job, filters.maxAgeDays)) return false;
  if (filters.format === 'remote' && !job.remote) return false;
  if (filters.format === 'office' && job.remote) return false;
  if (filters.employment !== 'any') {
    const hay = `${job.employment ?? ''} ${job.title} ${job.excerpt}`.toLowerCase();
    if (filters.employment === 'full') {
      if (job.employment && !/full|полн/.test(hay)) return false;
    }
    if (filters.employment === 'part' && !/part|частич|неполн/.test(hay)) return false;
    if (filters.employment === 'shift' && !/вахт|shift|rotat/.test(hay)) return false;
  }
  return true;
}

export function filterFeedIds(
  ids: string[],
  byId: Record<string, Job>,
  categories: CategoryId[],
  extra?: ExtraFilters | null,
): string[] {
  const multi = categories.filter((item) => item !== 'all');
  const matched: Job[] = [];
  for (const id of ids) {
    const job = byId[id];
    if (!job) continue;
    if (!jobMatchesExtra(job, extra ?? DEFAULT_EXTRA_FILTERS)) continue;
    if (multi.length > 1) {
      const hay = `${job.title} ${job.company} ${job.excerpt} ${job.category ?? ''}`;
      if (!jobMatchesCategories(hay, categories)) continue;
    }
    matched.push(job);
  }
  return matched.map((job) => job.id);
}

import { jobMatchesCategories } from './catalog';
import { salaryAmount } from './format';
import { compareJobsByDate, MAX_JOB_AGE_DAYS, isFreshJob } from './freshness';
import type { CategoryId, Job } from './types';

export type WorkFormat = 'any' | 'remote' | 'office';
export type EmploymentFilter = 'any' | 'full' | 'part' | 'shift';
export type AgeFilter = 3 | 7 | 14 | 30 | 90;

export type ExtraFilters = {
  salaryMin: number | null;
  format: WorkFormat;
  employment: EmploymentFilter;
  maxAgeDays: AgeFilter;
};

export const DEFAULT_EXTRA_FILTERS: ExtraFilters = {
  salaryMin: null,
  format: 'any',
  employment: 'any',
  maxAgeDays: MAX_JOB_AGE_DAYS,
};

export const SALARY_PRESETS = [
  { id: 'any', label: 'Любая', value: null },
  { id: '50', label: 'от 50 000', value: 50_000 },
  { id: '80', label: 'от 80 000', value: 80_000 },
  { id: '120', label: 'от 120 000', value: 120_000 },
  { id: '200', label: 'от 200 000', value: 200_000 },
] as const;

export const AGE_PRESETS: { id: AgeFilter; label: string }[] = [
  { id: 3, label: '3 дня' },
  { id: 7, label: 'Неделя' },
  { id: 14, label: '2 нед' },
  { id: 30, label: 'Месяц' },
  { id: 90, label: '3 мес' },
];

export function extraFiltersActive(filters?: ExtraFilters | null): boolean {
  if (!filters) return false;
  return (
    filters.salaryMin != null ||
    filters.format !== 'any' ||
    filters.employment !== 'any' ||
    filters.maxAgeDays !== MAX_JOB_AGE_DAYS
  );
}

export function jobMatchesExtra(job: Job, filters: ExtraFilters): boolean {
  if (!isFreshJob(job, filters.maxAgeDays)) return false;
  if (filters.format === 'remote' && !job.remote) return false;
  if (filters.format === 'office' && job.remote) return false;
  if (filters.salaryMin != null) {
    const amount = salaryAmount(job.salary);
    if (amount == null || amount < filters.salaryMin) return false;
  }
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
  matched.sort(compareJobsByDate);
  return matched.map((job) => job.id);
}

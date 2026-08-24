import { CATEGORIES, jobMatchesAnyLang } from './catalog';
import { salaryAmount } from './format';
import { jobAgeDays } from './freshness';
import { CHART_PALETTE, colors } from './theme';
import type { Job } from './types';

export type StatSlice = {
  id: string;
  label: string;
  value: number;
  color: string;
};

export type JobStats = {
  total: number;
  withSalary: number;
  remote: number;
  sources: StatSlice[];
  formats: StatSlice[];
  ages: StatSlice[];
  categories: StatSlice[];
};

const PALETTE = CHART_PALETTE;
const REST_ID = 'rest';

const AGE_BUCKETS: { id: string; test: (days: number) => boolean }[] = [
  { id: '3', test: (days) => days < 3 },
  { id: '7', test: (days) => days >= 3 && days < 7 },
  { id: '14', test: (days) => days >= 7 && days < 14 },
  { id: '30', test: (days) => days >= 14 && days < 30 },
  { id: '90', test: (days) => days >= 30 },
];

function toSlices(counts: Map<string, number>, limit = 8): StatSlice[] {
  const ranked = [...counts.entries()].sort((a, b) => b[1] - a[1]);
  const top = ranked.slice(0, limit);
  const rest = ranked.slice(limit).reduce((sum, [, value]) => sum + value, 0);
  const slices = top.map(([id, value], index) => ({
    id,
    label: id,
    value,
    color: PALETTE[index % PALETTE.length],
  }));
  if (rest > 0) {
    const existing = slices.find((item) => item.id === REST_ID);
    if (existing) existing.value += rest;
    else slices.push({ id: REST_ID, label: REST_ID, value: rest, color: PALETTE[top.length % PALETTE.length] });
  }
  return slices.filter((item) => item.value > 0);
}

export function slicesFromCounts(counts: Record<string, number>, limit = 8): StatSlice[] {
  return toSlices(new Map(Object.entries(counts).filter(([, value]) => value > 0)), limit);
}

function categoryId(job: Job): string {
  const hay = `${job.title} ${job.excerpt} ${job.category ?? ''}`;
  for (const category of CATEGORIES) {
    if (category.id === 'all') continue;
    if (jobMatchesAnyLang(hay, '', category.id)) {
      return category.id;
    }
  }
  return 'other';
}

export function computeJobStats(jobs: Job[]): JobStats {
  const sources = new Map<string, number>();
  const categories = new Map<string, number>();
  const ages = new Map<string, number>();
  let remote = 0;
  let office = 0;
  let withSalary = 0;

  for (const job of jobs) {
    sources.set(job.sourceName, (sources.get(job.sourceName) ?? 0) + 1);
    const category = categoryId(job);
    categories.set(category, (categories.get(category) ?? 0) + 1);
    if (job.remote) remote += 1;
    else office += 1;
    if (salaryAmount(job.salary) != null) withSalary += 1;
    const days = jobAgeDays(job.publishedAt);
    if (days == null) continue;
    const bucket = AGE_BUCKETS.find((item) => item.test(days));
    if (bucket) ages.set(bucket.id, (ages.get(bucket.id) ?? 0) + 1);
  }

  return {
    total: jobs.length,
    withSalary,
    remote,
    sources: toSlices(sources),
    formats: [
      { id: 'remote', label: 'remote', value: remote, color: colors.accent },
      { id: 'office', label: 'office', value: office, color: colors.blue },
    ].filter((item) => item.value > 0),
    ages: AGE_BUCKETS.flatMap((bucket, index) => {
      const value = ages.get(bucket.id) ?? 0;
      return value ? [{ id: bucket.id, label: bucket.id, value, color: PALETTE[index % PALETTE.length] }] : [];
    }),
    categories: toSlices(categories, 6),
  };
}

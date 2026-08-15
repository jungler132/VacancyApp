import { CATEGORIES, jobMatchesSearch } from './catalog';
import { salaryAmount } from './format';
import { jobAgeDays } from './freshness';
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

const PALETTE = ['#00D4A1', '#7BA3FF', '#E8C572', '#FF7A9C', '#A78BFA', '#FFB020', '#5EEAD4', '#60A5FA'];

const AGE_BUCKETS: { id: string; label: string; test: (days: number) => boolean }[] = [
  { id: '3', label: 'До 3 дней', test: (days) => days < 3 },
  { id: '7', label: '3–7 дней', test: (days) => days >= 3 && days < 7 },
  { id: '14', label: '1–2 недели', test: (days) => days >= 7 && days < 14 },
  { id: '30', label: '2–4 недели', test: (days) => days >= 14 && days < 30 },
  { id: '90', label: '1–3 месяца', test: (days) => days >= 30 },
];

function toSlices(counts: Map<string, number>, limit = 8): StatSlice[] {
  const ranked = [...counts.entries()].sort((a, b) => b[1] - a[1]);
  const top = ranked.slice(0, limit);
  const rest = ranked.slice(limit).reduce((sum, [, value]) => sum + value, 0);
  const slices = top.map(([label, value], index) => ({
    id: label,
    label,
    value,
    color: PALETTE[index % PALETTE.length],
  }));
  if (rest > 0) {
    slices.push({ id: 'other', label: 'Другое', value: rest, color: '#4B5568' });
  }
  return slices.filter((item) => item.value > 0);
}

function categoryLabel(job: Job): string {
  const hay = `${job.title} ${job.excerpt} ${job.category ?? ''}`;
  for (const category of CATEGORIES) {
    if (category.id === 'all') continue;
    if (jobMatchesSearch(hay, '', category.id, 'ru') || jobMatchesSearch(hay, '', category.id, 'en')) {
      return category.label;
    }
  }
  return 'Другое';
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
    const category = categoryLabel(job);
    categories.set(category, (categories.get(category) ?? 0) + 1);
    if (job.remote) remote += 1;
    else office += 1;
    if (salaryAmount(job.salary) != null) withSalary += 1;
    const days = jobAgeDays(job.publishedAt);
    if (days == null) continue;
    const bucket = AGE_BUCKETS.find((item) => item.test(days));
    if (bucket) ages.set(bucket.label, (ages.get(bucket.label) ?? 0) + 1);
  }

  return {
    total: jobs.length,
    withSalary,
    remote,
    sources: toSlices(sources),
    formats: [
      { id: 'remote', label: 'Удалёнка', value: remote, color: '#A78BFA' },
      { id: 'office', label: 'Офис', value: office, color: '#7BA3FF' },
    ].filter((item) => item.value > 0),
    ages: AGE_BUCKETS.flatMap((bucket, index) => {
      const value = ages.get(bucket.label) ?? 0;
      return value ? [{ id: bucket.id, label: bucket.label, value, color: PALETTE[index % PALETTE.length] }] : [];
    }),
    categories: toSlices(categories, 6),
  };
}

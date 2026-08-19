import { toPublishedAt } from './format';
import type { Job } from './types';

export const MAX_JOB_AGE_DAYS = 90;
const DAY_MS = 24 * 60 * 60 * 1000;

export function publishedMs(iso?: string): number | null {
  const normalized = toPublishedAt(iso);
  if (!normalized) return null;
  const time = Date.parse(normalized);
  if (!Number.isFinite(time)) return null;
  if (time > Date.now() + DAY_MS) return null;
  return time;
}

export function jobAgeDays(iso?: string): number | null {
  const time = publishedMs(iso);
  if (time == null) return null;
  return Math.floor((Date.now() - time) / DAY_MS);
}

export function isFreshJob(job: Pick<Job, 'publishedAt'>, maxAgeDays = MAX_JOB_AGE_DAYS): boolean {
  const time = publishedMs(job.publishedAt);
  if (time == null) return true;
  return Date.now() - time <= maxAgeDays * DAY_MS;
}

export function compareJobsByDate(a: Pick<Job, 'publishedAt' | 'title'>, b: Pick<Job, 'publishedAt' | 'title'>): number {
  const aTime = publishedMs(a.publishedAt) ?? 0;
  const bTime = publishedMs(b.publishedAt) ?? 0;
  if (aTime !== bTime) return bTime - aTime;
  return a.title.localeCompare(b.title, 'ru');
}

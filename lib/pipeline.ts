import { MAX_PIPELINE } from './limits';
import { REPLIED_STATUSES, isApplyStatus, type ApplyStatus } from './apply';
import type { Job } from './types';

export const MANUAL_SOURCE_ID = 'manual';
export const PIPELINE_LIMIT = MAX_PIPELINE;

export function isTrackedJob(job: Pick<Job, 'id' | 'sourceId'>): boolean {
  return job.sourceId === MANUAL_SOURCE_ID || job.id.startsWith('track:');
}

export function makeTrackedJobId(): string {
  return `track:${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

export function normalizeJobUrl(raw: string): string {
  const value = raw.trim();
  if (!value) return '';
  if (/^https?:\/\//i.test(value)) return value;
  if (/^[\w.-]+\.[a-z]{2,}([/:?#].*)?$/i.test(value)) return `https://${value}`;
  return value;
}

export function sourceNameFromUrl(url: string, fallback = 'Manual'): string {
  const href = normalizeJobUrl(url);
  const match = /^https?:\/\/([^/:?#]+)/i.exec(href);
  if (!match?.[1]) return fallback;
  return match[1].replace(/^www\./i, '');
}

export function makeTrackedJob(input: { title: string; company: string; url?: string }): Job {
  const url = normalizeJobUrl(input.url ?? '');
  return {
    id: makeTrackedJobId(),
    sourceId: MANUAL_SOURCE_ID,
    sourceName: sourceNameFromUrl(url),
    title: input.title.trim(),
    company: input.company.trim(),
    location: '',
    remote: false,
    url,
    excerpt: '',
    publishedAt: new Date().toISOString(),
  };
}

export function patchTrackedJob(
  job: Job,
  input: { title: string; company: string; url?: string; description?: string },
): Job {
  const url = normalizeJobUrl(input.url ?? job.url ?? '');
  const description = input.description?.trim();
  const excerpt = description ? description.slice(0, 180) : job.excerpt;
  return {
    ...job,
    title: input.title.trim() || job.title,
    company: input.company.trim() || job.company,
    url,
    sourceName: sourceNameFromUrl(url, job.sourceName),
    excerpt,
    description: description || job.description,
  };
}

export type PipelineStats = {
  total: number;
  replies: number;
  bestSource: string | null;
  counts: Record<ApplyStatus, number>;
};

export function pipelineStats(
  jobs: Job[],
  statuses: Record<string, ApplyStatus>,
  statusAt: Record<string, string> = {},
  now = Date.now(),
): PipelineStats {
  const counts = {
    applied: 0,
    review: 0,
    interview: 0,
    test: 0,
    offer: 0,
    rejected: 0,
  };
  const sources = new Map<string, number>();
  const monthAgo = now - 30 * 24 * 60 * 60 * 1000;
  let total = 0;
  let replies = 0;

  for (const job of jobs) {
    const status = statuses[job.id];
    if (!isApplyStatus(status)) continue;
    const stamped = Date.parse(statusAt[job.id] ?? '');
    if (Number.isFinite(stamped) && stamped < monthAgo) continue;
    counts[status] += 1;
    total += 1;
    if (REPLIED_STATUSES.includes(status)) replies += 1;
    const source = job.sourceName.trim() || job.sourceId;
    if (source) sources.set(source, (sources.get(source) ?? 0) + 1);
  }

  let bestSource: string | null = null;
  let bestCount = 0;
  for (const [name, count] of sources) {
    if (count > bestCount) {
      bestSource = name;
      bestCount = count;
    }
  }

  return { total, replies, bestSource, counts };
}

export function jobsForStatus(jobs: Job[], statuses: Record<string, ApplyStatus>, status: ApplyStatus): Job[] {
  return jobs.filter((job) => statuses[job.id] === status);
}

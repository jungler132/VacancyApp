import type { Job } from './types';

const cache = new Map<string, Job>();

export function rememberJobs(jobs: Job[]) {
  for (const job of jobs) cache.set(job.id, job);
}

export function rememberJob(job: Job) {
  cache.set(job.id, job);
}

export function getCachedJob(id: string): Job | undefined {
  return cache.get(id);
}

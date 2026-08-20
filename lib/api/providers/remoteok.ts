import type { Job, SearchParams } from '../../types';
import { jobMatchesRegion, jobMatchesSearch } from '../../catalog';
import { excerptOf, formatSalary, toPublishedAt } from '../../format';
import { DUMP_CACHE_MS, fetchJson } from '../../http';

type RemoteOkJob = {
  id?: string | number;
  position?: string;
  company?: string;
  location?: string;
  date?: string;
  url?: string;
  description?: string;
  tags?: string[];
  salary_min?: number;
  salary_max?: number;
  logo?: string;
};

export async function searchRemoteOK(params: SearchParams): Promise<Job[]> {
  const data = await fetchJson<RemoteOkJob[]>('https://remoteok.com/api', {
    signal: params.signal,
    cacheTtlMs: DUMP_CACHE_MS,
  });
  const jobs = Array.isArray(data) ? data.slice(1) : [];

  return jobs
    .filter((job) => {
      const loc = job.location ?? 'Remote';
      if (!jobMatchesRegion(loc, params.region, true)) return false;
      const hay = `${job.position} ${job.company} ${(job.tags ?? []).join(' ')}`;
      return jobMatchesSearch(hay, params.query, params.category, 'en');
    })
    .slice(0, 20)
    .map((job) => ({
      id: `remoteok:${job.id ?? job.position}`,
      sourceId: 'remoteok',
      sourceName: 'RemoteOK',
      title: job.position ?? 'Remote job',
      company: job.company ?? 'Company',
      companyLogo: job.logo,
      location: job.location ?? 'Remote',
      remote: true,
      salary: formatSalary(job.salary_min, job.salary_max, 'USD'),
      publishedAt: toPublishedAt(job.date),
      url: job.url ?? 'https://remoteok.com',
      excerpt: excerptOf((job.description ?? '').slice(0, 400) || job.position || ''),
    }));
}

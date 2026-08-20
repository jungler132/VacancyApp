import type { Job, SearchParams } from '../../types';
import { jobMatchesRegion, jobMatchesSearch } from '../../catalog';
import { excerptOf, toPublishedAt } from '../../format';
import { DUMP_CACHE_MS, fetchJson } from '../../http';

type ArbeitnowJob = {
  slug?: string;
  title?: string;
  company_name?: string;
  location?: string;
  remote?: boolean;
  url?: string;
  description?: string;
  created_at?: number | string;
  tags?: string[];
  job_types?: string[];
};

type ArbeitnowResponse = { data?: ArbeitnowJob[] };

export async function searchArbeitnow(params: SearchParams): Promise<Job[]> {
  const url = new URL('https://www.arbeitnow.com/api/job-board-api');
  if (params.page > 0) url.searchParams.set('page', String(params.page + 1));

  const data = await fetchJson<ArbeitnowResponse>(url.toString(), {
    signal: params.signal,
    cacheTtlMs: DUMP_CACHE_MS,
    bypassCache: params.bypassCache,
  });
  return (data.data ?? [])
    .filter((job) => {
      if (params.region === 'remote' && !job.remote) return false;
      if (!jobMatchesRegion(job.location ?? '', params.region, Boolean(job.remote))) return false;
      const hay = `${job.title} ${job.company_name} ${(job.tags ?? []).join(' ')}`;
      return jobMatchesSearch(hay, params.query, params.category, 'en');
    })
    .slice(0, 25)
    .map((job, index) => ({
      id: `arbeitnow:${job.slug ?? index}`,
      sourceId: 'arbeitnow',
      sourceName: 'Arbeitnow',
      title: job.title ?? 'Job',
      company: job.company_name ?? 'Company',
      location: job.location ?? 'Europe',
      remote: Boolean(job.remote),
      employment: job.job_types?.[0],
      publishedAt: toPublishedAt(job.created_at),
      url: job.url ?? 'https://www.arbeitnow.com',
      excerpt: excerptOf((job.description ?? '').slice(0, 400) || job.title || ''),
    }));
}

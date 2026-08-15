import type { Job, SearchParams } from '../../types';
import { buildQuery, jobMatchesRegion, jobMatchesSearch } from '../../catalog';
import { excerptOf, stripHtml, toPublishedAt } from '../../format';
import { fetchJson } from '../../http';

type HimalayasJob = {
  title?: string;
  companyName?: string;
  companyLogo?: string;
  location?: string;
  applicationLink?: string;
  excerpt?: string;
  description?: string;
  pubDate?: number | string;
  employmentType?: string;
  slug?: string;
  guid?: string;
};

type HimalayasResponse = {
  jobs?: HimalayasJob[];
  data?: HimalayasJob[];
};

export async function searchHimalayas(params: SearchParams): Promise<Job[]> {
  const q = buildQuery(params.query, params.category, 'en');
  const url = new URL('https://himalayas.app/jobs/api/search');
  if (q) url.searchParams.set('q', q);
  url.searchParams.set('sort', 'recent');
  url.searchParams.set('page', String(params.page + 1));
  if (!params.query.trim()) {
    if (params.region === 'europe') url.searchParams.set('country', 'germany');
    if (params.region === 'west') url.searchParams.set('country', 'united-states');
    if (params.region === 'asia') url.searchParams.set('country', 'india');
    if (params.region === 'remote') url.searchParams.set('worldwide', 'true');
  }

  const data = await fetchJson<HimalayasResponse>(url.toString(), { signal: params.signal });
  const rows = data.jobs ?? data.data ?? [];
  return rows
    .filter((job) => {
      if (!jobMatchesRegion(job.location ?? 'Worldwide', params.region, true)) {
        return false;
      }
      const hay = `${job.title} ${job.companyName} ${job.excerpt ?? ''}`;
      return jobMatchesSearch(hay, params.query, params.category, 'en');
    })
    .slice(0, 20)
    .map((job, index) => ({
      id: `himalayas:${job.guid ?? job.slug ?? job.title ?? index}`,
      sourceId: 'himalayas',
      sourceName: 'Himalayas',
      title: job.title ?? 'Remote job',
      company: job.companyName ?? 'Company',
      companyLogo: job.companyLogo,
      location: job.location ?? 'Remote',
      remote: true,
      employment: job.employmentType,
      publishedAt: toPublishedAt(job.pubDate),
      url: job.applicationLink ?? 'https://himalayas.app/jobs',
      excerpt: excerptOf(job.excerpt || job.description || job.title || ''),
      description: stripHtml(job.description || job.excerpt),
    }));
}

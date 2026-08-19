import type { Job, SearchParams } from '../../types';
import { jobMatchesRegion, jobMatchesSearch } from '../../catalog';
import { excerptOf, htmlToText, toPublishedAt } from '../../format';
import { fetchJson } from '../../http';

type NomadJob = {
  url?: string;
  title?: string;
  description?: string;
  company_name?: string;
  category_name?: string;
  tags?: string[] | string;
  location?: string;
  pub_date?: string;
};

export async function searchWorkingNomads(params: SearchParams): Promise<Job[]> {
  if (params.page > 0) return [];
  const rows = await fetchJson<NomadJob[]>('https://www.workingnomads.com/api/exposed_jobs/', {
    signal: params.signal,
  });
  return (Array.isArray(rows) ? rows : [])
    .filter((job) => {
      if (!job.url?.trim() || !job.title?.trim()) return false;
      const loc = job.location ?? 'Remote';
      if (!jobMatchesRegion(loc, params.region, true)) return false;
      const tags = Array.isArray(job.tags) ? job.tags.join(' ') : job.tags ?? '';
      const hay = `${job.title} ${job.company_name ?? ''} ${job.category_name ?? ''} ${tags}`;
      return jobMatchesSearch(hay, params.query, params.category, 'en');
    })
    .slice(0, 25)
    .map((job, index) => {
      const title = job.title?.trim() || 'Remote job';
      const body = htmlToText(job.description);
      return {
        id: `workingnomads:${job.url ?? `${title}-${index}`}`,
        sourceId: 'workingnomads',
        sourceName: 'Working Nomads',
        title,
        company: job.company_name?.trim() || 'Company',
        location: job.location?.trim() || 'Remote',
        remote: true,
        category: job.category_name,
        publishedAt: toPublishedAt(job.pub_date),
        url: job.url?.trim() || 'https://www.workingnomads.com',
        excerpt: excerptOf(body || title),
        description: body,
      };
    });
}

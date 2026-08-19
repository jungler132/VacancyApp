import type { Job, SearchParams } from '../../types';
import { jobMatchesRegion, jobMatchesSearch } from '../../catalog';
import { excerptOf, htmlToText, toPublishedAt } from '../../format';
import { fetchJson } from '../../http';

type MuseCompany = { name?: string };
type MuseRef = { landing_page?: string; external?: string };
type MuseJob = {
  id?: number | string;
  name?: string;
  publication_date?: string;
  locations?: { name?: string }[];
  categories?: { name?: string }[];
  levels?: { name?: string }[];
  contents?: string;
  refs?: MuseRef;
  company?: MuseCompany;
};

type MuseResponse = { results?: MuseJob[] };

export async function searchTheMuse(params: SearchParams): Promise<Job[]> {
  const url = new URL('https://www.themuse.com/api/public/jobs');
  url.searchParams.set('page', String(params.page));
  url.searchParams.set('descending', 'true');
  if (params.category === 'it') url.searchParams.append('category', 'Software Engineering');
  if (params.category === 'marketing') url.searchParams.append('category', 'Marketing');
  if (params.category === 'hr') url.searchParams.append('category', 'HR');
  if (params.category === 'finance') url.searchParams.append('category', 'Data and Analytics');
  if (params.category === 'hospitality') url.searchParams.append('category', 'Food and Hospitality Services');
  if (params.region === 'remote') url.searchParams.append('location', 'Flexible / Remote');

  const data = await fetchJson<MuseResponse>(url.toString(), { signal: params.signal });
  return (data.results ?? [])
    .map((job, index) => {
      const title = job.name?.trim() || 'Job';
      const location = job.locations?.map((item) => item.name).filter(Boolean).join(', ') || 'Worldwide';
      const remote = /remote|flexible/i.test(location);
      const url = job.refs?.landing_page?.trim() || job.refs?.external?.trim() || '';
      const body = htmlToText(job.contents);
      return {
        id: `muse:${job.id ?? `${title}-${index}`}`,
        sourceId: 'muse',
        sourceName: 'The Muse',
        title,
        company: job.company?.name?.trim() || 'Company',
        location,
        remote,
        experience: job.levels?.[0]?.name,
        category: job.categories?.[0]?.name,
        publishedAt: toPublishedAt(job.publication_date),
        url,
        excerpt: excerptOf(body || title),
        description: body,
      } satisfies Job;
    })
    .filter((job) => {
      if (!job.url) return false;
      if (!jobMatchesRegion(job.location, params.region, job.remote)) return false;
      return jobMatchesSearch(`${job.title} ${job.company} ${job.category ?? ''}`, params.query, params.category, 'en');
    })
    .slice(0, 20);
}

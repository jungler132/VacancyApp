import type { Job, SearchParams } from '../../types';
import { buildQuery, jobMatchesRegion, jobMatchesSearch } from '../../catalog';
import { excerptOf, fetchJson, stripHtml, toPublishedAt } from '../../format';

type RemotiveJob = {
  id?: number;
  url?: string;
  title?: string;
  company_name?: string;
  company_logo?: string;
  category?: string;
  job_type?: string;
  publication_date?: string;
  candidate_required_location?: string;
  salary?: string;
  description?: string;
};

type RemotiveResponse = { jobs?: RemotiveJob[] };

export async function searchRemotive(params: SearchParams): Promise<Job[]> {
  const q = buildQuery(params.query, params.category, 'en');
  const url = new URL('https://remotive.com/api/remote-jobs');
  if (q) url.searchParams.set('search', q);
  url.searchParams.set('limit', '30');

  const data = await fetchJson<RemotiveResponse>(url.toString(), { signal: params.signal });
  return (data.jobs ?? [])
    .filter((job) => {
      if (!jobMatchesRegion(job.candidate_required_location ?? 'Worldwide', params.region, true)) {
        return false;
      }
      const hay = `${job.title} ${job.company_name} ${job.category ?? ''}`;
      return jobMatchesSearch(hay, params.query, params.category, 'en');
    })
    .slice(0, 25)
    .map((job) => ({
      id: `remotive:${job.id ?? job.title}`,
      sourceId: 'remotive',
      sourceName: 'Remotive',
      title: job.title ?? 'Remote job',
      company: job.company_name ?? 'Company',
      companyLogo: job.company_logo,
      location: job.candidate_required_location ?? 'Remote',
      remote: true,
      salary: job.salary || undefined,
      employment: job.job_type,
      category: job.category,
      publishedAt: toPublishedAt(job.publication_date),
      url: job.url ?? 'https://remotive.com',
      excerpt: excerptOf(job.description || job.title || ''),
      description: stripHtml(job.description),
    }));
}

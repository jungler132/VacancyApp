import type { Job, SearchParams } from '../../types';
import { buildQuery, jobMatchesRegion, jobMatchesSearch } from '../../catalog';
import { excerptOf, fetchJson, stripHtml, toPublishedAt } from '../../format';

type JobicyJob = {
  id?: number | string;
  url?: string;
  jobTitle?: string;
  companyName?: string;
  companyLogo?: string;
  jobGeo?: string;
  jobType?: string[] | string;
  jobIndustry?: string[] | string;
  jobExcerpt?: string;
  jobDescription?: string;
  pubDate?: string;
};

type JobicyResponse = { jobs?: JobicyJob[] };

export async function searchJobicy(params: SearchParams): Promise<Job[]> {
  const q = buildQuery(params.query, params.category, 'en');
  const url = new URL('https://jobicy.com/api/v2/remote-jobs');
  url.searchParams.set('count', '20');
  if (q) url.searchParams.set('tag', q.split(' ')[0] ?? q);

  const data = await fetchJson<JobicyResponse>(url.toString(), { signal: params.signal });
  return (data.jobs ?? [])
    .filter((job) => {
      const loc = job.jobGeo ?? '';
      if (!jobMatchesRegion(loc, params.region, true)) return false;
      const hay = `${job.jobTitle} ${job.companyName} ${job.jobIndustry} ${job.jobExcerpt ?? ''}`;
      return jobMatchesSearch(hay, params.query, params.category, 'en');
    })
    .slice(0, 20)
    .map((job) => ({
      id: `jobicy:${job.id ?? job.jobTitle}`,
      sourceId: 'jobicy',
      sourceName: 'Jobicy',
      title: job.jobTitle ?? 'Remote job',
      company: job.companyName ?? 'Company',
      companyLogo: job.companyLogo,
      location: job.jobGeo ?? 'Remote',
      remote: true,
      employment: Array.isArray(job.jobType) ? job.jobType[0] : job.jobType,
      category: Array.isArray(job.jobIndustry) ? job.jobIndustry[0] : job.jobIndustry,
      publishedAt: toPublishedAt(job.pubDate),
      url: job.url ?? 'https://jobicy.com',
      excerpt: excerptOf(job.jobExcerpt || job.jobDescription || job.jobTitle || ''),
      description: stripHtml(job.jobDescription || job.jobExcerpt),
    }));
}

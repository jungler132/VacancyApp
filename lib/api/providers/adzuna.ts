import type { Job, SearchParams } from '../../types';
import { buildQuery } from '../../catalog';
import { excerptOf, fetchJson, formatSalary, stripHtml, toPublishedAt } from '../../format';

type AdzunaJob = {
  id?: string | number;
  title?: string;
  company?: { display_name?: string };
  location?: { display_name?: string };
  created?: string;
  redirect_url?: string;
  description?: string;
  salary_min?: number;
  salary_max?: number;
  contract_time?: string;
};

type AdzunaResponse = { results?: AdzunaJob[] };

const REGION_COUNTRIES: Record<string, string[]> = {
  cis: ['ru'],
  europe: ['de', 'gb', 'fr', 'pl', 'nl'],
  west: ['us', 'ca', 'gb', 'au'],
  asia: ['in', 'sg'],
  all: ['gb', 'us', 'de', 'in'],
  remote: ['gb', 'us'],
};

export async function searchAdzuna(params: SearchParams): Promise<Job[]> {
  const appId = process.env.EXPO_PUBLIC_ADZUNA_APP_ID;
  const appKey = process.env.EXPO_PUBLIC_ADZUNA_APP_KEY;
  if (!appId || !appKey) return [];

  const what = buildQuery(params.query, params.category, 'en');
  const countries = REGION_COUNTRIES[params.region] ?? ['gb'];
  const country = countries[params.page % countries.length] ?? 'gb';
  const page = params.page + 1;
  const url = new URL(`https://api.adzuna.com/v1/api/jobs/${country}/search/${page}`);
  url.searchParams.set('app_id', appId);
  url.searchParams.set('app_key', appKey);
  url.searchParams.set('results_per_page', '20');
  if (what) url.searchParams.set('what', what);
  url.searchParams.set('content-type', 'application/json');

  const data = await fetchJson<AdzunaResponse>(url.toString(), { signal: params.signal });
  return (data.results ?? []).map((job) => ({
    id: `adzuna:${country}:${job.id ?? job.title}`,
    sourceId: 'adzuna',
    sourceName: 'Adzuna',
    title: job.title ?? 'Job',
    company: job.company?.display_name ?? 'Company',
    location: job.location?.display_name ?? country.toUpperCase(),
    remote: /remote/i.test(job.title ?? '') || /remote/i.test(job.location?.display_name ?? ''),
    salary: formatSalary(job.salary_min, job.salary_max, country === 'gb' ? 'GBP' : country === 'us' ? 'USD' : undefined),
    employment: job.contract_time,
    publishedAt: toPublishedAt(job.created),
    url: job.redirect_url ?? 'https://www.adzuna.com',
    excerpt: excerptOf(job.description || job.title || ''),
    description: stripHtml(job.description),
  }));
}

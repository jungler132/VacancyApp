import type { Job, SearchParams } from '../../types';
import { parseFound } from '../found';
import { buildQuery } from '../../catalog';
import { excerptOf, formatSalary, htmlToText, toPublishedAt } from '../../format';
import { fetchJson } from '../../http';
import { adzunaTarget } from '../../placeQuery';

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

type AdzunaResponse = { results?: AdzunaJob[]; count?: number };

const ADZUNA_CURRENCY: Record<string, string> = {
  gb: 'GBP',
  us: 'USD',
  de: 'EUR',
  fr: 'EUR',
  nl: 'EUR',
  pl: 'PLN',
  ca: 'CAD',
  au: 'AUD',
  in: 'INR',
  sg: 'SGD',
};

export async function searchAdzuna(params: SearchParams): Promise<{ jobs: Job[]; found?: number }> {
  const appId = process.env.EXPO_PUBLIC_ADZUNA_APP_ID;
  const appKey = process.env.EXPO_PUBLIC_ADZUNA_APP_KEY;
  if (!appId || !appKey) return { jobs: [] };

  const target = adzunaTarget(params.placeId, params.region, params.page);
  if (!target) return { jobs: [] };

  const what = buildQuery(params.query, params.category, 'en');
  const page = params.page + 1;
  const url = new URL(`https://api.adzuna.com/v1/api/jobs/${target.country}/search/${page}`);
  url.searchParams.set('app_id', appId);
  url.searchParams.set('app_key', appKey);
  url.searchParams.set('results_per_page', '20');
  if (what) url.searchParams.set('what', what);
  if (target.where) url.searchParams.set('where', target.where);
  url.searchParams.set('content-type', 'application/json');

  const data = await fetchJson<AdzunaResponse>(url.toString(), { signal: params.signal });
  const jobs = (data.results ?? []).map((job) => ({
    id: `adzuna:${target.country}:${job.id ?? job.title}`,
    sourceId: 'adzuna',
    sourceName: 'Adzuna',
    title: job.title ?? 'Job',
    company: job.company?.display_name ?? 'Company',
    location: job.location?.display_name ?? target.where ?? target.country.toUpperCase(),
    remote: /remote/i.test(job.title ?? '') || /remote/i.test(job.location?.display_name ?? ''),
    salary: formatSalary(job.salary_min, job.salary_max, ADZUNA_CURRENCY[target.country]),
    employment: job.contract_time,
    publishedAt: toPublishedAt(job.created),
    url: job.redirect_url ?? 'https://www.adzuna.com',
    excerpt: excerptOf(job.description || job.title || ''),
    description: htmlToText(job.description),
  }));
  const found = parseFound(data);
  return { jobs, found };
}

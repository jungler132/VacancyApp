import type { Job, SearchParams } from '../../types';
import { buildQuery } from '../../catalog';
import { excerptOf, stripHtml, toPublishedAt } from '../../format';
import { fetchJson } from '../../http';

type JoobleJob = {
  title?: string;
  location?: string;
  snippet?: string;
  salary?: string;
  type?: string;
  link?: string;
  company?: string;
  updated?: string;
};

type JoobleResponse = { jobs?: JoobleJob[] };

const REGION_LOCATION: Record<string, string> = {
  cis: 'Russia',
  az: 'Azerbaijan',
  europe: 'Germany',
  west: 'United States',
  asia: 'Singapore',
  all: '',
  remote: 'Remote',
};

function joobleLang(region: SearchParams['region']) {
  if (region === 'az') return 'az' as const;
  if (region === 'cis') return 'ru' as const;
  return 'en' as const;
}

export async function searchJooble(params: SearchParams): Promise<Job[]> {
  const key = process.env.EXPO_PUBLIC_JOOBLE_KEY;
  if (!key) return [];

  const keywords = buildQuery(params.query, params.category, joobleLang(params.region)) || (params.region === 'az' ? 'vakansiya' : 'job');
  const data = await fetchJson<JoobleResponse>(`https://jooble.org/api/${key}`, {
    signal: params.signal,
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      keywords,
      location: REGION_LOCATION[params.region] ?? '',
      page: String(params.page + 1),
    }),
  });

  return (data.jobs ?? []).slice(0, 20).map((job, index) => ({
    id: `jooble:${job.link ?? index}`,
    sourceId: 'jooble',
    sourceName: 'Jooble',
    title: job.title ?? 'Job',
    company: job.company ?? 'Company',
    location: job.location || (params.region === 'az' ? 'Azerbaijan' : ''),
    remote: /remote|удал/i.test(`${job.location} ${job.type}`),
    salary: job.salary || undefined,
    employment: job.type,
    publishedAt: toPublishedAt(job.updated),
    url: job.link ?? 'https://jooble.org',
    excerpt: excerptOf(job.snippet || job.title || ''),
    description: stripHtml(job.snippet),
  }));
}

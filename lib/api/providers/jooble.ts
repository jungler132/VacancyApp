import type { Job, SearchParams } from '../../types';
import { parseFound } from '../found';
import { buildQuery } from '../../catalog';
import { annotateSalary, excerptOf, htmlToText, toPublishedAt } from '../../format';
import { fetchJson } from '../../http';
import { joobleCurrency, joobleLang, joobleLocation } from '../../placeQuery';

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

type JoobleResponse = { jobs?: JoobleJob[]; totalCount?: number | string; total?: number | string };

export async function searchJooble(params: SearchParams): Promise<{ jobs: Job[]; found?: number }> {
  const key = process.env.EXPO_PUBLIC_JOOBLE_KEY;
  if (!key) return { jobs: [] };

  const lang = joobleLang(params.placeId, params.region);
  const location = joobleLocation(params.placeId, params.region);
  const keywords = buildQuery(params.query, params.category, lang) || (lang === 'az' ? 'vakansiya' : 'job');
  const data = await fetchJson<JoobleResponse>(`https://jooble.org/api/${key}`, {
    signal: params.signal,
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      keywords,
      location,
      page: String(params.page + 1),
    }),
  });

  const jobs = (data.jobs ?? []).slice(0, 20).map((job, index) => ({
    id: `jooble:${job.link ?? index}`,
    sourceId: 'jooble',
    sourceName: 'Jooble',
    title: job.title ?? 'Job',
    company: job.company ?? 'Company',
    location: job.location || location,
    remote: /remote|удал/i.test(`${job.location} ${job.type}`),
    salary: annotateSalary(job.salary, joobleCurrency(params.placeId, params.region)),
    employment: job.type,
    publishedAt: toPublishedAt(job.updated),
    url: job.link ?? 'https://jooble.org',
    excerpt: excerptOf(job.snippet || job.title || ''),
    description: htmlToText(job.snippet),
  }));
  const found = parseFound(data);
  return { jobs, found };
}

import type { Job, SearchParams } from '../../types';
import { CIS_AREAS, buildQuery } from '../../catalog';
import { excerptOf, formatSalary, htmlToText, stripHtml, toPublishedAt } from '../../format';
import { inferPlaceId } from '../../places';
import { fetchHhApi } from '../hhProxy';
import { parseFound } from '../found';

type HhSalary = { from?: number | null; to?: number | null; currency?: string | null };
type HhVacancy = {
  id: string;
  name: string;
  employer?: { name?: string; logo_urls?: { '90'?: string; original?: string } };
  area?: { name?: string };
  salary?: HhSalary | null;
  published_at?: string;
  alternate_url?: string;
  apply_alternate_url?: string;
  snippet?: { requirement?: string; responsibility?: string };
  schedule?: { name?: string };
  employment?: { name?: string };
  experience?: { name?: string };
};

type HhSearch = { items?: HhVacancy[]; pages?: number; found?: number };

type HhBoard = {
  id: 'hh' | 'hhaz';
  name: string;
  site: string;
  areas: string[];
  fallbackLocation: string;
  lang: 'ru' | 'az';
};

export function isHhJobId(id: string): boolean {
  return id.startsWith('hh:') || id.startsWith('hhaz:');
}

export function hhVacancyId(id: string): string {
  return id.startsWith('hhaz:') ? id.slice(5) : id.slice(3);
}

async function searchHh(
  params: SearchParams,
  board: HhBoard,
): Promise<{ jobs: Job[]; found?: number }> {
  const text = buildQuery(params.query, params.category, board.lang);
  const query = new URLSearchParams();
  if (text) query.set('text', text);
  query.set('per_page', '20');
  query.set('page', String(params.page));
  query.set('order_by', 'publication_time');
  for (const area of board.areas) query.append('area', area);

  const data = await fetchHhApi<HhSearch>('search', query, params.signal);
  const jobs = (data.items ?? []).map((item) => {
    const snippet = [item.snippet?.responsibility, item.snippet?.requirement]
      .filter(Boolean)
      .join(' ');
    const alternate = item.alternate_url?.replace('://hh.ru', `://${board.site}`);
    return {
      id: `${board.id}:${item.id}`,
      sourceId: board.id,
      sourceName: board.name,
      title: item.name,
      company: item.employer?.name ?? 'Компания',
      companyLogo: item.employer?.logo_urls?.['90'] ?? item.employer?.logo_urls?.original,
      location: item.area?.name ?? board.fallbackLocation,
      cityId: inferPlaceId(item.area?.name),
      remote: /удал|remote|distant/i.test(item.schedule?.name ?? ''),
      salary: formatSalary(item.salary?.from, item.salary?.to, item.salary?.currency),
      employment: item.employment?.name,
      experience: item.experience?.name,
      schedule: item.schedule?.name,
      publishedAt: toPublishedAt(item.published_at),
      url: alternate ?? `https://${board.site}/vacancy/${item.id}`,
      excerpt: excerptOf(snippet || item.name),
      description: stripHtml(snippet),
    };
  });
  const found = parseFound(data);
  return { jobs, found: found && found > jobs.length ? found : undefined };
}

export async function searchHeadHunter(params: SearchParams) {
  return searchHh(params, {
    id: 'hh',
    name: 'HeadHunter',
    site: 'hh.ru',
    areas: CIS_AREAS,
    fallbackLocation: 'СНГ',
    lang: 'ru',
  });
}

export async function searchHeadHunterAz(params: SearchParams) {
  return searchHh(params, {
    id: 'hhaz',
    name: 'HeadHunter AZ',
    site: 'hh1.az',
    areas: ['9'],
    fallbackLocation: 'Азербайджан',
    lang: 'az',
  });
}

export async function fetchHeadHunterDetails(vacancyId: string, signal?: AbortSignal): Promise<Partial<Job>> {
  const data = await fetchHhApi<{
    description?: string;
    salary?: HhSalary | null;
    name?: string;
    employer?: { name?: string };
    area?: { name?: string };
    alternate_url?: string;
    schedule?: { name?: string };
    employment?: { name?: string };
    experience?: { name?: string };
  }>('details', new URLSearchParams({ id: vacancyId }), signal);
  return {
    title: data.name,
    company: data.employer?.name,
    location: data.area?.name,
    cityId: inferPlaceId(data.area?.name),
    salary: formatSalary(data.salary?.from, data.salary?.to, data.salary?.currency),
    description: htmlToText(data.description),
    url: data.alternate_url,
    remote: /удал|remote|distant/i.test(data.schedule?.name ?? ''),
    employment: data.employment?.name,
    experience: data.experience?.name,
    schedule: data.schedule?.name,
  };
}

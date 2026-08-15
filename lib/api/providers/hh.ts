import type { Job, SearchParams } from '../../types';
import { CIS_AREAS, buildQuery } from '../../catalog';
import { excerptOf, formatSalary, stripHtml, toPublishedAt } from '../../format';
import { fetchJson } from '../../http';

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

type HhSearch = { items?: HhVacancy[]; pages?: number };

const HOSTS = ['https://api.hh.ru'];
const HH_HEADERS = {
  'User-Agent': 'WorklyJobs/1.0 (workly.app.contact@gmail.com)',
  'HH-User-Agent': 'WorklyJobs/1.0 (workly.app.contact@gmail.com)',
};

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

async function searchHh(params: SearchParams, board: HhBoard): Promise<Job[]> {
  const text = buildQuery(params.query, params.category, board.lang);
  const url = new URL(`${HOSTS[0]}/vacancies`);
  if (text) url.searchParams.set('text', text);
  url.searchParams.set('per_page', '25');
  url.searchParams.set('page', String(params.page));
  url.searchParams.set('order_by', 'publication_time');
  for (const area of board.areas) url.searchParams.append('area', area);

  const data = await fetchJson<HhSearch>(url.toString(), {
    signal: params.signal,
    headers: HH_HEADERS,
  });

  return (data.items ?? []).map((item) => {
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
      remote: /удал|remote|distant/i.test(item.schedule?.name ?? ''),
      salary: formatSalary(item.salary?.from, item.salary?.to, item.salary?.currency),
      employment: item.employment?.name,
      publishedAt: toPublishedAt(item.published_at),
      url: alternate ?? `https://${board.site}/vacancy/${item.id}`,
      excerpt: excerptOf(snippet || item.name),
      description: stripHtml(snippet),
    };
  });
}

export async function searchHeadHunter(params: SearchParams): Promise<Job[]> {
  return searchHh(params, {
    id: 'hh',
    name: 'HeadHunter',
    site: 'hh.ru',
    areas: CIS_AREAS,
    fallbackLocation: 'СНГ',
    lang: 'ru',
  });
}

export async function searchHeadHunterAz(params: SearchParams): Promise<Job[]> {
  return searchHh(params, {
    id: 'hhaz',
    name: 'HeadHunter AZ',
    site: 'hh.az',
    areas: ['9'],
    fallbackLocation: 'Азербайджан',
    lang: 'az',
  });
}

export async function fetchHeadHunterDetails(vacancyId: string, signal?: AbortSignal): Promise<Partial<Job>> {
  const data = await fetchJson<{
    description?: string;
    salary?: HhSalary | null;
    name?: string;
    employer?: { name?: string };
    area?: { name?: string };
    alternate_url?: string;
    schedule?: { name?: string };
    employment?: { name?: string };
  }>(`https://api.hh.ru/vacancies/${vacancyId}`, {
    signal,
    headers: HH_HEADERS,
  });
  return {
    title: data.name,
    company: data.employer?.name,
    location: data.area?.name,
    salary: formatSalary(data.salary?.from, data.salary?.to, data.salary?.currency),
    description: stripHtml(data.description),
    url: data.alternate_url,
    remote: /удал|remote|distant/i.test(data.schedule?.name ?? ''),
    employment: data.employment?.name,
  };
}

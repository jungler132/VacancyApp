import type { Job, SearchParams } from '../../types';
import { buildQuery } from '../../catalog';
import { annotateSalary, excerptOf, formatSalary, stripHtml, toPublishedAt } from '../../format';
import { fetchJson } from '../../http';

type TrudVacancy = {
  vacancy?: {
    id?: string;
    'job-name'?: string;
    company?: { name?: string };
    region?: { name?: string };
    salary?: string | number;
    salary_min?: number;
    salary_max?: number;
    currency?: string;
    duty?: string;
    requirement?: string;
    'vac_url'?: string;
    'creation-date'?: string;
    employment?: string;
    schedule?: { name?: string } | string;
  };
};

type TrudResponse = {
  results?: { vacancies?: TrudVacancy[] };
};

export async function searchTrudvsem(params: SearchParams): Promise<Job[]> {
  const text = buildQuery(params.query, params.category, 'ru');
  const url = new URL('https://opendata.trudvsem.ru/api/v1/vacancies');
  if (text) url.searchParams.set('text', text);
  url.searchParams.set('offset', String(params.page));
  url.searchParams.set('limit', '20');

  const data = await fetchJson<TrudResponse>(url.toString(), { signal: params.signal });
  const rows = data.results?.vacancies ?? [];

  return rows
    .map((row) => row.vacancy)
    .filter((v): v is NonNullable<TrudVacancy['vacancy']> => Boolean(v?.['job-name']))
    .map((v, index) => {
      const min = Number(v.salary_min) || undefined;
      const max = Number(v.salary_max) || undefined;
      const duty = stripHtml(v.duty);
      return {
        id: `trudvsem:${v.id ?? `${v['job-name']}-${index}`}`,
        sourceId: 'trudvsem',
        sourceName: 'Работа России',
        title: v['job-name'] ?? 'Вакансия',
        company: v.company?.name ?? 'Работодатель',
        location: v.region?.name ?? 'Россия',
        remote: /удал/i.test(String(v.schedule ?? '')),
        salary: formatSalary(min, max, v.currency) ?? annotateSalary(v.salary ? String(v.salary) : undefined, v.currency || 'RUB'),
        employment: typeof v.employment === 'string' ? v.employment : undefined,
        publishedAt: toPublishedAt(v['creation-date']),
        url: v.vac_url ?? 'https://trudvsem.ru',
        excerpt: excerptOf(duty || v.requirement || v['job-name'] || ''),
        description: duty || stripHtml(v.requirement),
      };
    });
}

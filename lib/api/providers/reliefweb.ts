import type { Job, SearchParams } from '../../types';
import { buildQuery } from '../../catalog';
import { excerptOf, fetchJson, stripHtml } from '../../format';

type ReliefItem = {
  id?: string;
  href?: string;
  fields?: {
    title?: string;
    url?: string;
    date?: { created?: string };
    source?: { name?: string }[];
    country?: { name?: string }[];
    body?: string;
  };
};

type ReliefResponse = { data?: ReliefItem[] };

export async function searchReliefWeb(params: SearchParams): Promise<Job[]> {
  const q = buildQuery(params.query, params.category, 'en') || 'job';
  const url = new URL('https://api.reliefweb.int/v1/jobs');
  url.searchParams.set('appname', 'workly');
  url.searchParams.set('limit', '20');
  url.searchParams.set('profile', 'list');
  url.searchParams.set('query[value]', q);
  url.searchParams.set('sort[]', 'date:desc');
  url.searchParams.set('offset', String(params.page * 20));

  const data = await fetchJson<ReliefResponse>(url.toString(), { signal: params.signal });
  return (data.data ?? []).map((item) => {
    const country = item.fields?.country?.map((c) => c.name).join(', ');
    return {
      id: `reliefweb:${item.id ?? item.fields?.title}`,
      sourceId: 'reliefweb',
      sourceName: 'ReliefWeb',
      title: item.fields?.title ?? 'Humanitarian job',
      company: item.fields?.source?.[0]?.name ?? 'NGO',
      location: country ?? 'Worldwide',
      remote: /remote/i.test(country ?? ''),
      publishedAt: item.fields?.date?.created,
      url: item.fields?.url ?? item.href ?? 'https://reliefweb.int',
      excerpt: excerptOf(item.fields?.body || item.fields?.title || ''),
      description: stripHtml(item.fields?.body),
    };
  });
}

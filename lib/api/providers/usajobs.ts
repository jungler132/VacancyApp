import type { Job, SearchParams } from '../../types';
import { buildQuery } from '../../catalog';
import { excerptOf, formatSalary, htmlToText, toPublishedAt } from '../../format';
import { fetchJson } from '../../http';

type UsaJob = {
  MatchedObjectId?: string;
  MatchedObjectDescriptor?: {
    PositionTitle?: string;
    OrganizationName?: string;
    PositionURI?: string;
    PositionLocationDisplay?: string;
    PublicationStartDate?: string;
    UserArea?: { Details?: { JobSummary?: string } };
    PositionRemuneration?: { MinimumRange?: string; MaximumRange?: string; Description?: string }[];
  };
};

type UsaResponse = { SearchResult?: { SearchResultItems?: UsaJob[] } };

export async function searchUsaJobs(params: SearchParams): Promise<Job[]> {
  const key = process.env.EXPO_PUBLIC_USAJOBS_KEY;
  const email = process.env.EXPO_PUBLIC_USAJOBS_EMAIL;
  if (!key || !email) return [];
  if (params.region !== 'west' && params.region !== 'all' && params.region !== 'remote') return [];

  const url = new URL('https://data.usajobs.gov/api/search');
  url.searchParams.set('Keyword', buildQuery(params.query, params.category, 'en') || 'all');
  url.searchParams.set('ResultsPerPage', '20');
  url.searchParams.set('Page', String(params.page + 1));

  const data = await fetchJson<UsaResponse>(url.toString(), {
    signal: params.signal,
    headers: {
      Host: 'data.usajobs.gov',
      'User-Agent': email,
      'Authorization-Key': key,
    },
  });

  return (data.SearchResult?.SearchResultItems ?? []).map((item) => {
    const d = item.MatchedObjectDescriptor ?? {};
    const pay = d.PositionRemuneration?.[0];
    return {
      id: `usajobs:${item.MatchedObjectId ?? d.PositionTitle}`,
      sourceId: 'usajobs',
      sourceName: 'USAJobs',
      title: d.PositionTitle ?? 'Federal job',
      company: d.OrganizationName ?? 'U.S. Government',
      location: d.PositionLocationDisplay ?? 'United States',
      remote: /remote|telework/i.test(d.PositionLocationDisplay ?? ''),
      salary: formatSalary(Number(pay?.MinimumRange) || null, Number(pay?.MaximumRange) || null, 'USD'),
      publishedAt: toPublishedAt(d.PublicationStartDate),
      url: d.PositionURI ?? 'https://www.usajobs.gov',
      excerpt: excerptOf(d.UserArea?.Details?.JobSummary || d.PositionTitle || ''),
      description: htmlToText(d.UserArea?.Details?.JobSummary),
    };
  });
}

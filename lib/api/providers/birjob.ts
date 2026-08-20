import type { CategoryId, Job, SearchParams } from '../../types';
import { jobMatchesAnyLang } from '../../catalog';
import { excerptOf, toPublishedAt } from '../../format';
import { DUMP_CACHE_MS, fetchJson } from '../../http';

type BirJobItem = {
  title?: string;
  company?: string;
  apply_url?: string;
  location?: string;
  posted_at?: string;
  source?: string;
  category?: string | null;
};

type BirJobResponse = { jobs?: BirJobItem[] };

const CATEGORY_SLUGS: Partial<Record<CategoryId, string[]>> = {
  sales: ['satis'],
  medicine: ['tibb'],
  logistics: ['surucu', 'logistika'],
  construction: ['insaat'],
  education: ['tehsil'],
  hospitality: ['iae', 'qida'],
  finance: ['maliyye', 'bank'],
  it: ['it'],
  legal: ['huquq'],
  hr: ['insan-resurslari'],
  marketing: ['marketing'],
};

export async function searchBirJob(params: SearchParams): Promise<Job[]> {
  if (params.page > 0) return [];

  const data = await fetchJson<BirJobResponse>('https://www.birjob.com/api/llm/jobs', {
    signal: params.signal,
    cacheTtlMs: DUMP_CACHE_MS,
    bypassCache: params.bypassCache,
  });

  return (data.jobs ?? [])
    .filter((job) => matchesBirJob(job, params))
    .slice(0, 25)
    .map((job, index) => {
      const title = job.title?.trim() || 'Vakansiya';
      const url = job.apply_url ?? 'https://www.birjob.com';
      return {
        id: `birjob:${url || index}`,
        sourceId: 'birjob',
        sourceName: 'BirJob',
        title,
        company: job.company?.trim() || 'Şirkət',
        location: job.location?.trim() || 'Azərbaycan',
        remote: /remote|удал|distant|hybrid|hibrid/i.test(`${job.title} ${job.location}`),
        publishedAt: toPublishedAt(job.posted_at),
        url,
        excerpt: excerptOf([job.source, job.category, title].filter(Boolean).join(' · ')),
        category: job.category ?? undefined,
      };
    });
}

function matchesBirJob(job: BirJobItem, params: SearchParams): boolean {
  const hay = `${job.title ?? ''} ${job.company ?? ''} ${job.category ?? ''} ${job.source ?? ''}`;
  if (params.query.trim()) {
    return jobMatchesAnyLang(hay, params.query, 'all');
  }
  if (params.category === 'all') return true;
  const slugs = CATEGORY_SLUGS[params.category] ?? [];
  if (job.category && slugs.includes(job.category)) return true;
  return jobMatchesAnyLang(hay, '', params.category);
}

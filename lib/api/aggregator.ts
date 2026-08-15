import type { Job, SearchParams, SearchResult, SourceInfo } from '../types';
import { jobMatchesAnyLang } from '../catalog';
import { describeSourceError, isAbortError } from './errors';
import { jobKey } from '../format';
import { compareJobsByDate, isFreshJob } from '../freshness';
import { searchHeadHunter, searchHeadHunterAz } from './providers/hh';
import { searchBirJob } from './providers/birjob';
import { searchTrudvsem } from './providers/trudvsem';
import { searchArbeitnow } from './providers/arbeitnow';
import { searchRemotive } from './providers/remotive';
import { searchJobicy } from './providers/jobicy';
import { searchRemoteOK } from './providers/remoteok';
import { searchHimalayas } from './providers/himalayas';
import { searchAdzuna } from './providers/adzuna';
import { searchJooble } from './providers/jooble';
import { searchUsaJobs } from './providers/usajobs';

type Provider = {
  id: string;
  run: (params: SearchParams) => Promise<Job[]>;
  regions: Array<SearchParams['region'] | 'any'>;
  paginated?: boolean;
};

const PROVIDERS: Provider[] = [
  { id: 'hh', run: searchHeadHunter, regions: ['all', 'cis'], paginated: true },
  { id: 'hhaz', run: searchHeadHunterAz, regions: ['az'], paginated: true },
  { id: 'birjob', run: searchBirJob, regions: ['all', 'cis', 'az'] },
  { id: 'trudvsem', run: searchTrudvsem, regions: ['all', 'cis'], paginated: true },
  { id: 'arbeitnow', run: searchArbeitnow, regions: ['all', 'europe', 'remote'] },
  { id: 'remotive', run: searchRemotive, regions: ['all', 'europe', 'west', 'asia', 'remote'] },
  { id: 'jobicy', run: searchJobicy, regions: ['all', 'europe', 'west', 'asia', 'remote'] },
  { id: 'remoteok', run: searchRemoteOK, regions: ['all', 'europe', 'west', 'asia', 'remote'] },
  { id: 'himalayas', run: searchHimalayas, regions: ['all', 'europe', 'west', 'asia', 'remote'] },
  { id: 'adzuna', run: searchAdzuna, regions: ['all', 'cis', 'europe', 'west', 'asia', 'remote'], paginated: true },
  { id: 'jooble', run: searchJooble, regions: ['any'], paginated: true },
  { id: 'usajobs', run: searchUsaJobs, regions: ['all', 'west', 'remote'] },
];

export const SOURCES: SourceInfo[] = [
  { id: 'hh', name: 'HeadHunter', regionLabel: 'СНГ', status: 'live', note: 'hh.ru, все профессии' },
  { id: 'hhaz', name: 'HeadHunter AZ', regionLabel: 'Азербайджан', status: 'live', note: 'hh.az, вакансии по Азербайджану' },
  { id: 'birjob', name: 'BirJob', regionLabel: 'Азербайджан', status: 'live', note: 'Агрегатор AZ-площадок: Boss, HelloJob, Glorri и др.' },
  { id: 'trudvsem', name: 'Работа России', regionLabel: 'Россия', status: 'live', note: 'Госпортал trudvsem.ru' },
  { id: 'arbeitnow', name: 'Arbeitnow', regionLabel: 'Европа', status: 'live', note: 'Вакансии по Европе' },
  { id: 'remotive', name: 'Remotive', regionLabel: 'Удалёнка', status: 'live', note: 'Удалёнка, все сферы' },
  { id: 'jobicy', name: 'Jobicy', regionLabel: 'Удалёнка', status: 'live', note: 'Remote с гео-метками' },
  { id: 'remoteok', name: 'RemoteOK', regionLabel: 'Удалёнка', status: 'live', note: 'Публичный JSON API' },
  { id: 'himalayas', name: 'Himalayas', regionLabel: 'Удалёнка', status: 'live', note: 'Поиск по странам' },
  { id: 'reliefweb', name: 'ReliefWeb', regionLabel: 'NGO', status: 'soon', note: 'API отключён (410)' },
  { id: 'adzuna', name: 'Adzuna', regionLabel: 'EU / US / Asia', status: 'key', note: 'Ключ подключен, если задан в .env' },
  { id: 'jooble', name: 'Jooble', regionLabel: '70+ стран', status: 'key', note: 'Ключ подключен, если задан в .env' },
  { id: 'usajobs', name: 'USAJobs', regionLabel: 'США', status: 'key', note: 'Нужны KEY и EMAIL' },
  { id: 'reed', name: 'Reed', regionLabel: 'Великобритания', status: 'soon', note: 'Подключим позже' },
  { id: 'muse', name: 'The Muse', regionLabel: 'США / EU', status: 'soon', note: 'Нужен ключ' },
];

export function availableSourceIds(): string[] {
  const ids = SOURCES.filter((source) => source.status === 'live').map((source) => source.id);
  if (process.env.EXPO_PUBLIC_ADZUNA_APP_ID && process.env.EXPO_PUBLIC_ADZUNA_APP_KEY) ids.push('adzuna');
  if (process.env.EXPO_PUBLIC_JOOBLE_KEY) ids.push('jooble');
  if (process.env.EXPO_PUBLIC_USAJOBS_KEY && process.env.EXPO_PUBLIC_USAJOBS_EMAIL) ids.push('usajobs');
  return ids;
}

export function enabledSourceIds(disabledIds: string[] = []): string[] {
  const off = new Set(disabledIds);
  return availableSourceIds().filter((id) => !off.has(id));
}

export async function searchJobs(params: SearchParams): Promise<SearchResult> {
  const enabled = new Set(params.enabledSources?.length ? params.enabledSources : enabledSourceIds());
  const selected = PROVIDERS.filter((provider) => {
    if (!enabled.has(provider.id)) return false;
    if (params.page > 0 && !provider.paginated) return false;
    return provider.regions.includes('any') || provider.regions.includes(params.region);
  });

  const settled = await Promise.allSettled(
    selected.map((provider) => provider.run({ ...params, signal: params.signal })),
  );
  const jobs: Job[] = [];
  const errors: SearchResult['errors'] = [];
  const seen = new Set<string>();

  settled.forEach((result, index) => {
    const provider = selected[index];
    if (result.status === 'rejected') {
      if (isAbortError(result.reason) || params.signal?.aborted) return;
      const message = describeSourceError(result.reason);
      if (message === 'отменено' || /код 410/.test(message)) return;
      errors.push({
        sourceId: provider.id,
        sourceName: SOURCES.find((item) => item.id === provider.id)?.name ?? provider.id,
        message,
      });
      return;
    }
    for (const job of result.value) {
      const hay = `${job.title} ${job.company} ${job.excerpt} ${job.category ?? ''}`;
      if (!jobMatchesAnyLang(hay, params.query, params.category)) {
        continue;
      }
      const key = jobKey(job.title, job.company);
      if (seen.has(key)) continue;
      if (!isFreshJob(job)) continue;
      seen.add(key);
      jobs.push(job);
    }
  });

  jobs.sort(compareJobsByDate);

  return {
    jobs,
    errors,
    hasMore: selected.some((p) => p.paginated) && jobs.length > 0,
  };
}

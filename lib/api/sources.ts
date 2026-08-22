import type { SourceInfo } from '../types';

export const SOURCES: SourceInfo[] = [
  { id: 'hh', name: 'HeadHunter', regionLabel: 'СНГ', status: 'live', note: 'hh.ru, все профессии' },
  { id: 'hhaz', name: 'HeadHunter AZ', regionLabel: 'Азербайджан', status: 'live', note: 'hh1.az, вакансии по Азербайджану' },
  { id: 'birjob', name: 'BirJob', regionLabel: 'Азербайджан', status: 'live', note: 'Агрегатор AZ-площадок: Boss, HelloJob, Glorri и др.' },
  { id: 'trudvsem', name: 'Работа России', regionLabel: 'Россия', status: 'live', note: 'Госпортал trudvsem.ru' },
  { id: 'arbeitnow', name: 'Arbeitnow', regionLabel: 'Европа', status: 'live', note: 'Вакансии по Европе' },
  { id: 'remotive', name: 'Remotive', regionLabel: 'Удалёнка', status: 'live', note: 'Удалёнка, все сферы' },
  { id: 'jobicy', name: 'Jobicy', regionLabel: 'Удалёнка', status: 'live', note: 'Remote с гео-метками' },
  { id: 'remoteok', name: 'RemoteOK', regionLabel: 'Удалёнка', status: 'live', note: 'Публичный JSON API' },
  { id: 'himalayas', name: 'Himalayas', regionLabel: 'Удалёнка', status: 'live', note: 'Поиск по странам' },
  { id: 'adzuna', name: 'Adzuna', regionLabel: 'EU / US / Asia', status: 'key', note: 'Ключ подключен, если задан в .env' },
  { id: 'jooble', name: 'Jooble', regionLabel: '70+ стран', status: 'key', note: 'Ключ подключен, если задан в .env' },
  { id: 'usajobs', name: 'USAJobs', regionLabel: 'США', status: 'key', note: 'Нужны KEY и EMAIL' },
  { id: 'muse', name: 'The Muse', regionLabel: 'США / EU', status: 'live', note: 'Публичный API, переход на вакансию' },
  { id: 'workingnomads', name: 'Working Nomads', regionLabel: 'Удалёнка', status: 'live', note: 'Remote JSON, мало полей — всё равно в ленте' },
  { id: 'nofluff', name: 'No Fluff Jobs', regionLabel: 'Европа', status: 'soon', note: 'Сайт в ресурсах, лента API слишком тяжёлая' },
  { id: 'reed', name: 'Reed', regionLabel: 'Великобритания', status: 'soon', note: 'Подключим позже' },
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

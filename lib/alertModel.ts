import { DEFAULT_EXTRA_FILTERS, parseExtraFilters, type ExtraFilters } from './filters';
import { keyOf, t } from './i18n';
import { DEFAULT_LOCALE, type AppLocale } from './i18n/locale';
import { placeLabel } from './places';
import type { CategoryId, Job, RegionId } from './types';

export const ALERTS_KEY = 'vakano:saved-searches';
export const MAX_ALERTS = 6;
const MAX_SEEN = 250;

export type SavedSearch = {
  id: string;
  query: string;
  region: RegionId;
  categories: CategoryId[];
  extra: ExtraFilters;
  enabled: boolean;
  lastSeenIds: string[];
  lastCheckedAt: number;
  lastNotifiedAt: number;
  createdAt: number;
  pendingNew: number;
  pendingNewIds: string[];
  pendingJobs: Job[];
};

export type SearchSnapshot = {
  query: string;
  region: RegionId;
  categories: CategoryId[];
  extra: ExtraFilters;
};

export function makeAlertKey(search: SearchSnapshot): string {
  const extra = search.extra ?? DEFAULT_EXTRA_FILTERS;
  return [
    search.region,
    [...search.categories].sort().join(','),
    search.query.trim().toLowerCase(),
    extra.format,
    extra.employment,
    extra.maxAgeDays,
    extra.placeId || '',
  ].join('|');
}

export function alertLabel(search: SearchSnapshot, locale: AppLocale = DEFAULT_LOCALE): string {
  const extra = search.extra ?? DEFAULT_EXTRA_FILTERS;
  const parts: string[] = [];
  const q = search.query.trim();
  if (q) parts.push(q);
  parts.push(t(locale, keyOf('region', search.region)));
  const cats = search.categories.filter((id) => id !== 'all');
  if (cats.length) {
    parts.push(cats.map((id) => t(locale, keyOf('category', id))).join(', '));
  }
  if (extra.maxAgeDays !== 90) {
    parts.push(t(locale, keyOf('filters.age', extra.maxAgeDays)));
  }
  if (extra.format === 'remote') parts.push(t(locale, 'filters.format.remote'));
  if (extra.format === 'office') parts.push(t(locale, 'filters.format.office'));
  if (extra.placeId) parts.push(placeLabel(extra.placeId, locale) || extra.placeId);
  return parts.slice(0, 4).join(' · ') || t(locale, 'alerts.all');
}

function parsePendingJobs(raw: unknown): Job[] {
  if (!Array.isArray(raw)) return [];
  const out: Job[] = [];
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue;
    const row = item as Partial<Job>;
    if (typeof row.id !== 'string' || typeof row.title !== 'string' || typeof row.url !== 'string') continue;
    out.push({
      id: row.id,
      sourceId: typeof row.sourceId === 'string' ? row.sourceId : 'app',
      sourceName: typeof row.sourceName === 'string' ? row.sourceName : 'Vakano',
      title: row.title,
      company: typeof row.company === 'string' ? row.company : '',
      location: typeof row.location === 'string' ? row.location : '',
      remote: Boolean(row.remote),
      url: row.url,
      excerpt: typeof row.excerpt === 'string' ? row.excerpt.slice(0, 280) : '',
      publishedAt: typeof row.publishedAt === 'string' ? row.publishedAt : undefined,
      salary: typeof row.salary === 'string' ? row.salary : undefined,
      cityId: typeof row.cityId === 'string' ? row.cityId : undefined,
    });
    if (out.length >= 80) break;
  }
  return out;
}

export function slimJob(job: Job): Job {
  return {
    id: job.id,
    sourceId: job.sourceId,
    sourceName: job.sourceName,
    title: job.title,
    company: job.company,
    location: job.location,
    remote: job.remote,
    url: job.url,
    excerpt: (job.excerpt ?? '').slice(0, 280),
    publishedAt: job.publishedAt,
    salary: job.salary,
    cityId: job.cityId,
  };
}

export function normalizeAlerts(raw: unknown): SavedSearch[] {
  if (!Array.isArray(raw)) return [];
  const out: SavedSearch[] = [];
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue;
    const row = item as Partial<SavedSearch>;
    if (typeof row.id !== 'string' || typeof row.region !== 'string') continue;
    const pendingNewIds = Array.isArray(row.pendingNewIds)
      ? row.pendingNewIds.filter((id): id is string => typeof id === 'string').slice(0, 80)
      : [];
    const pendingJobs = parsePendingJobs(row.pendingJobs).filter((job) => pendingNewIds.includes(job.id));
    out.push({
      id: row.id,
      query: typeof row.query === 'string' ? row.query : '',
      region: row.region as RegionId,
      categories: Array.isArray(row.categories) ? (row.categories as CategoryId[]) : ['all'],
      extra: parseExtraFilters(row.extra),
      enabled: row.enabled !== false,
      lastSeenIds: Array.isArray(row.lastSeenIds) ? row.lastSeenIds.filter((id) => typeof id === 'string') : [],
      lastCheckedAt: typeof row.lastCheckedAt === 'number' ? row.lastCheckedAt : 0,
      lastNotifiedAt: typeof row.lastNotifiedAt === 'number' ? row.lastNotifiedAt : 0,
      createdAt: typeof row.createdAt === 'number' ? row.createdAt : Date.now(),
      pendingNew:
        typeof row.pendingNew === 'number' && Number.isFinite(row.pendingNew)
          ? Math.min(999, Math.max(0, Math.floor(row.pendingNew)))
          : 0,
      pendingNewIds,
      pendingJobs,
    });
  }
  return out.slice(0, MAX_ALERTS);
}

function trimSeen(ids: string[]): string[] {
  return ids.length > MAX_SEEN ? ids.slice(0, MAX_SEEN) : ids;
}

export function mergeAlertHits(
  alert: SavedSearch,
  ids: string[],
  jobs: Job[],
  now: number,
): { fresh: Job[]; seeded: boolean } {
  alert.lastCheckedAt = now;
  if (!alert.lastSeenIds.length) {
    alert.lastSeenIds = trimSeen(ids);
    return { fresh: [], seeded: true };
  }

  const seen = new Set(alert.lastSeenIds);
  const freshIds = ids.filter((id) => !seen.has(id));
  const byId: Record<string, Job> = Object.create(null);
  for (const job of jobs) byId[job.id] = job;
  const fresh = freshIds.map((id) => byId[id]).filter((job): job is Job => Boolean(job)).map(slimJob);

  alert.lastSeenIds = trimSeen([...freshIds, ...alert.lastSeenIds]);
  if (!fresh.length) return { fresh: [], seeded: false };

  alert.pendingNew = Math.min(999, (alert.pendingNew ?? 0) + fresh.length);
  const prevIds = Array.isArray(alert.pendingNewIds) ? alert.pendingNewIds : [];
  const prevJobs = Array.isArray(alert.pendingJobs) ? alert.pendingJobs : [];
  alert.pendingNewIds = [...freshIds, ...prevIds.filter((id) => !freshIds.includes(id))].slice(0, 80);
  const keep = new Set(alert.pendingNewIds);
  const freshSet = new Set(freshIds);
  alert.pendingJobs = [...fresh, ...prevJobs.filter((job) => keep.has(job.id) && !freshSet.has(job.id))].slice(0, 80);
  return { fresh, seeded: false };
}

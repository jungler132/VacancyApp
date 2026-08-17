import AsyncStorage from '@react-native-async-storage/async-storage';

import { enabledSourceIds, searchJobs } from '@/lib/api/aggregator';
import { apiCategory } from '@/lib/catalog';
import { DEFAULT_EXTRA_FILTERS, filterFeedIds, type ExtraFilters } from '@/lib/filters';
import { keyOf, t } from '@/lib/i18n';
import { DEFAULT_LOCALE, type AppLocale } from '@/lib/i18n/locale';
import { notifyNewJobs } from '@/lib/notifications';
import { DISABLED_SOURCES_KEY } from '@/lib/store/sourcesSlice';
import type { CategoryId, Job, RegionId } from '@/lib/types';

export const ALERTS_KEY = 'workly:saved-searches';
export const MAX_ALERTS = 6;
const MAX_SEEN = 250;
const CHECK_COOLDOWN_MS = 8 * 60 * 1000;
const NOTIFY_COOLDOWN_MS = 40 * 60 * 1000;

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
    extra.salaryMin ?? 'any',
    extra.format,
    extra.employment,
    extra.maxAgeDays,
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
  if (extra.salaryMin != null) parts.push(t(locale, 'alerts.salaryK', { amount: Math.round(extra.salaryMin / 1000) }));
  if (extra.maxAgeDays !== 90) {
    parts.push(t(locale, keyOf('filters.age', extra.maxAgeDays)));
  }
  if (extra.format === 'remote') parts.push(t(locale, 'filters.format.remote'));
  if (extra.format === 'office') parts.push(t(locale, 'filters.format.office'));
  return parts.slice(0, 4).join(' · ') || t(locale, 'alerts.all');
}

export function normalizeAlerts(raw: unknown): SavedSearch[] {
  if (!Array.isArray(raw)) return [];
  const out: SavedSearch[] = [];
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue;
    const row = item as Partial<SavedSearch>;
    if (typeof row.id !== 'string' || typeof row.region !== 'string') continue;
    out.push({
      id: row.id,
      query: typeof row.query === 'string' ? row.query : '',
      region: row.region as RegionId,
      categories: Array.isArray(row.categories) ? (row.categories as CategoryId[]) : ['all'],
      extra: { ...DEFAULT_EXTRA_FILTERS, ...(row.extra ?? {}) },
      enabled: row.enabled !== false,
      lastSeenIds: Array.isArray(row.lastSeenIds) ? row.lastSeenIds.filter((id) => typeof id === 'string') : [],
      lastCheckedAt: typeof row.lastCheckedAt === 'number' ? row.lastCheckedAt : 0,
      lastNotifiedAt: typeof row.lastNotifiedAt === 'number' ? row.lastNotifiedAt : 0,
      createdAt: typeof row.createdAt === 'number' ? row.createdAt : Date.now(),
    });
  }
  return out.slice(0, MAX_ALERTS);
}

export async function loadAlerts(): Promise<SavedSearch[]> {
  const raw = await AsyncStorage.getItem(ALERTS_KEY);
  if (!raw) return [];
  try {
    return normalizeAlerts(JSON.parse(raw));
  } catch {
    return [];
  }
}

export async function persistAlerts(items: SavedSearch[]): Promise<void> {
  await AsyncStorage.setItem(ALERTS_KEY, JSON.stringify(items)).catch(() => undefined);
}

function trimSeen(ids: string[]): string[] {
  return ids.length > MAX_SEEN ? ids.slice(0, MAX_SEEN) : ids;
}

async function loadDisabledSources(): Promise<string[]> {
  const raw = await AsyncStorage.getItem(DISABLED_SOURCES_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === 'string') : [];
  } catch {
    return [];
  }
}

export async function checkSavedSearches(options?: {
  notify?: boolean;
  skipKey?: string;
  force?: boolean;
}): Promise<SavedSearch[]> {
  const notify = options?.notify !== false;
  const alerts = await loadAlerts();
  const enabled = alerts.filter((item) => item.enabled);
  if (!enabled.length) return alerts;

  const sources = enabledSourceIds(await loadDisabledSources());
  const now = Date.now();
  let changed = false;

  for (const alert of enabled) {
    if (!options?.force && alert.lastCheckedAt && now - alert.lastCheckedAt < CHECK_COOLDOWN_MS) continue;
    try {
      const result = await searchJobs({
        query: alert.query,
        region: alert.region,
        category: apiCategory(alert.categories),
        enabledSources: sources,
        page: 0,
      });
      const byId: Record<string, Job> = {};
      for (const job of result.jobs) byId[job.id] = job;
      const ids = filterFeedIds(
        result.jobs.map((job) => job.id),
        byId,
        alert.categories,
        alert.extra,
      );
      alert.lastCheckedAt = now;
      changed = true;

      if (!alert.lastSeenIds.length) {
        alert.lastSeenIds = trimSeen(ids);
        continue;
      }

      const seen = new Set(alert.lastSeenIds);
      const fresh = ids.filter((id) => !seen.has(id));
      alert.lastSeenIds = trimSeen([...fresh, ...alert.lastSeenIds]);

      const skip = options?.skipKey && options.skipKey === makeAlertKey(alert);
      const cooled = now - alert.lastNotifiedAt < NOTIFY_COOLDOWN_MS;
      if (!notify || skip || cooled || fresh.length === 0) continue;

      alert.lastNotifiedAt = now;
      await notifyNewJobs(fresh.length, alertLabel(alert), alert.id);
    } catch {
      alert.lastCheckedAt = now;
      changed = true;
    }
  }

  if (changed) await persistAlerts(alerts);
  return alerts;
}

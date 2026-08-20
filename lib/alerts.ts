import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  ALERTS_KEY,
  alertLabel,
  makeAlertKey,
  mergeAlertHits,
  normalizeAlerts,
  type SavedSearch,
} from '@/lib/alertModel';
import { enabledSourceIds, searchJobs } from '@/lib/api/aggregator';
import { apiCategory } from '@/lib/catalog';
import { filterFeedIds } from '@/lib/filters';
import { notifyNewJobs } from '@/lib/notifications';
import { readPersisted } from '@/lib/persist';
import { readStoredLocale } from '@/lib/store/appearanceSlice';
import { DISABLED_SOURCES_KEY } from '@/lib/store/sourcesSlice';
import type { Job } from '@/lib/types';

export {
  ALERTS_KEY,
  MAX_ALERTS,
  alertLabel,
  makeAlertKey,
  mergeAlertHits,
  normalizeAlerts,
  slimJob,
  type SavedSearch,
  type SearchSnapshot,
} from '@/lib/alertModel';

const CHECK_COOLDOWN_MS = 8 * 60 * 1000;
const NOTIFY_COOLDOWN_MS = 40 * 60 * 1000;

export async function loadAlerts(): Promise<SavedSearch[]> {
  const raw = await readPersisted(ALERTS_KEY);
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

export type CheckSavedSearchesOptions = {
  notify?: boolean;
  skipKey?: string;
  force?: boolean;
  alerts?: SavedSearch[];
  persist?: boolean;
};

export type CheckSavedSearchesResult = {
  alerts: SavedSearch[];
  jobs: Job[];
  changed: boolean;
};

export async function checkSavedSearches(
  options?: CheckSavedSearchesOptions,
): Promise<CheckSavedSearchesResult> {
  const notify = options?.notify !== false;
  const persist = options?.persist !== false;
  const alerts = options?.alerts ? normalizeAlerts(options.alerts) : await loadAlerts();
  const enabled = alerts.filter((item) => item.enabled);
  if (!enabled.length) return { alerts, jobs: [], changed: false };

  const sources = enabledSourceIds(await loadDisabledSources());
  const locale = await readStoredLocale();
  const now = Date.now();
  let changed = false;
  const found: Job[] = [];

  for (const alert of enabled) {
    if (!options?.force && alert.lastCheckedAt && now - alert.lastCheckedAt < CHECK_COOLDOWN_MS) {
      found.push(...(alert.pendingJobs ?? []));
      continue;
    }
    try {
      const result = await searchJobs({
        query: alert.query,
        region: alert.region,
        category: apiCategory(alert.categories),
        enabledSources: sources,
        page: 0,
        placeId: alert.extra?.placeId,
      });
      const byId: Record<string, Job> = {};
      for (const job of result.jobs) byId[job.id] = job;
      const ids = filterFeedIds(
        result.jobs.map((job) => job.id),
        byId,
        alert.categories,
        alert.extra,
      );
      const { fresh, seeded } = mergeAlertHits(
        alert,
        ids,
        ids.map((id) => byId[id]).filter((job): job is Job => Boolean(job)),
        now,
      );
      changed = true;
      found.push(...(alert.pendingJobs ?? []), ...fresh);
      if (seeded) continue;

      const skip = options?.skipKey && options.skipKey === makeAlertKey(alert);
      const cooled = now - alert.lastNotifiedAt < NOTIFY_COOLDOWN_MS;
      if (!notify || skip || cooled || fresh.length === 0) continue;

      alert.lastNotifiedAt = now;
      await notifyNewJobs(fresh.length, alertLabel(alert, locale), alert.id, locale);
    } catch {
      alert.lastCheckedAt = now;
      changed = true;
    }
  }

  if (persist && changed) await persistAlerts(alerts);
  return { alerts, jobs: found, changed };
}

async function loadDisabledSources(): Promise<string[]> {
  const raw = await readPersisted(DISABLED_SOURCES_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === 'string') : [];
  } catch {
    return [];
  }
}

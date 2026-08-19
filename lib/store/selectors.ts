import { createSelector } from '@reduxjs/toolkit';

import { enabledSourceIds } from '@/lib/api/aggregator';
import { apiCategory } from '@/lib/catalog';
import { extraFiltersActive } from '@/lib/filters';
import { computeJobStats } from '@/lib/stats';
import { mergeVisibleIds } from '@/lib/tiers';
import type { Job } from '@/lib/types';
import { toServiceMaster } from '@/lib/services/catalog';
import { OWN_PROFILE_ID } from './freelanceSlice';
import { resolveCatalogItem } from './savedCatalogSlice';
import { todayCard } from '@/lib/today';
import type { RootState } from './index';
import { makeFeedKey, type FeedCache } from './jobsSlice';
import type { CategoryId, RegionId, SourceError } from '@/lib/types';

const EMPTY_IDS: string[] = [];
const EMPTY_JOBS: Job[] = [];

const emptyFeed: FeedCache = {
  ids: [],
  page: 0,
  hasMore: false,
  exhaustedSources: [],
  errors: [],
  fetchedAt: 0,
  status: 'idle',
};

export const selectEnabledSources = createSelector(
  [(state: RootState) => state.sources.disabledIds],
  (disabledIds) => enabledSourceIds(disabledIds),
);

export const selectFeedKey = createSelector(
  [
    (state: RootState) => state.filters.query,
    (state: RootState) => state.filters.region,
    (state: RootState) => state.filters.categories,
    selectEnabledSources,
  ],
  (query, region, categories, sources) => makeFeedKey(query, region, apiCategory(categories), sources),
);

export const selectActiveFeed = createSelector(
  [selectFeedKey, (state: RootState) => state.jobs.feeds],
  (key, feeds) => feeds[key] ?? emptyFeed,
);

export const selectLocalJobMap = createSelector([(state: RootState) => state.localJobs.items], (items) => {
  const map: Record<string, Job> = Object.create(null);
  for (const item of items) map[item.id] = item;
  return map;
});

export const selectVisibleIds = createSelector(
  [
    selectActiveFeed,
    (state: RootState) => state.jobs.byId,
    (state: RootState) => state.filters.query,
    (state: RootState) => state.filters.region,
    (state: RootState) => state.filters.categories,
    (state: RootState) => state.filters.extra,
    (state: RootState) => state.filters.tierFilter,
    (state: RootState) => state.localJobs.items,
    (state: RootState) => state.jobs.worklyPublicIds,
  ],
  (feed, byId, query, region, categories, extra, tierFilter, localJobs, worklyPublicIds) => {
    const extras: Job[] = [];
    for (const id of worklyPublicIds) {
      const job = byId[id];
      if (job) extras.push(job);
    }
    return mergeVisibleIds(feed.ids.length ? feed.ids : EMPTY_IDS, [...localJobs, ...extras], byId, {
      query,
      region,
      categories,
      extra,
      tierFilter,
    });
  },
);

export const selectVisibleCount = createSelector([selectVisibleIds], (ids) => ids.length);

export const selectVisibleJobs = createSelector(
  [selectVisibleIds, (state: RootState) => state.jobs.byId, selectLocalJobMap],
  (ids, byId, localMap) => {
    if (!ids.length) return EMPTY_JOBS;
    return ids.map((id) => byId[id] ?? localMap[id]).filter(Boolean);
  },
);

export const selectJobStats = createSelector([selectVisibleJobs], computeJobStats);

export const selectFiltersActive = createSelector([(state: RootState) => state.filters], (filters) => {
  if (!filters) return false;
  return (
    extraFiltersActive(filters.extra) ||
    filters.categories.length > 1 ||
    filters.categories[0] !== 'all' ||
    filters.region !== 'all'
  );
});

export const selectFeed = (query: string, region: RegionId, category: CategoryId, sources: string[] = []) =>
  createSelector(
    [(state: RootState) => state.jobs.feeds[makeFeedKey(query, region, category, sources)]],
    (feed) => feed ?? emptyFeed,
  );

export const selectFeedJobs = (query: string, region: RegionId, category: CategoryId, sources: string[] = []) =>
  createSelector(
    [
      (state: RootState) => state.jobs.feeds[makeFeedKey(query, region, category, sources)],
      (state: RootState) => state.jobs.byId,
    ],
    (feed, byId) => (feed?.ids ?? []).map((id) => byId[id]).filter(Boolean),
  );

export const selectSavedJobMap = createSelector(
  [(state: RootState) => state.saved.items],
  (items) => {
    const map: Record<string, Job> = Object.create(null);
    for (const item of items) map[item.id] = item;
    return map;
  },
);

export const selectJobById = (id: string) => (state: RootState) =>
  (id ? state.jobs.byId[id] : undefined) ?? selectSavedJobMap(state)[id] ?? selectLocalJobMap(state)[id];

export const selectViewedJob = (state: RootState) =>
  state.jobs.viewedId ? state.jobs.byId[state.jobs.viewedId] : undefined;

export const selectIsSaved = (id: string) => (state: RootState) => Boolean(selectSavedJobMap(state)[id]);

export const selectSavedIdSet = createSelector([selectSavedJobMap], (map) => new Set(Object.keys(map)));

export const selectSavedCatalogItems = createSelector(
  [(state: RootState) => state.savedCatalog.items],
  (items) => items.map(resolveCatalogItem),
);

export const selectSavedCatalogMap = createSelector([selectSavedCatalogItems], (items) => {
  const map: Record<string, true> = Object.create(null);
  for (const item of items) map[`${item.kind}:${item.id}`] = true;
  return map;
});

export const selectIsCatalogSaved = (kind: 'telegram' | 'site', id: string) => (state: RootState) =>
  Boolean(selectSavedCatalogMap(state)[`${kind}:${id}`]);

const EMPTY_ERRORS: SourceError[] = [];
const EMPTY_ERROR_MAP: Record<string, string> = Object.create(null);

export const selectSourceErrorMap = createSelector([(state: RootState) => state.jobs.feeds], (feeds) => {
  const map: Record<string, string> = Object.create(null);
  for (const feed of Object.values(feeds)) {
    for (const error of feed?.errors ?? []) {
      if (!error?.sourceId || !error?.message) continue;
      if (!map[error.sourceId]) map[error.sourceId] = error.message;
    }
  }
  return Object.keys(map).length ? map : EMPTY_ERROR_MAP;
});

function isOwnCatalogEntry(
  id: string,
  email: string | undefined,
  own: { id: string; email?: string } | undefined,
  userId: string | null,
) {
  if (!id) return false;
  if (id === OWN_PROFILE_ID || own?.id === id) return true;
  if (userId && (id === userId || id === `user:${userId}`)) return true;
  const ownEmail = own?.email?.trim().toLowerCase();
  const nextEmail = email?.trim().toLowerCase();
  return Boolean(ownEmail && nextEmail && ownEmail === nextEmail);
}

export const selectOwnMaster = createSelector(
  [(state: RootState) => state.freelance.profile, (state: RootState) => state.freelance.offers],
  (profile, offers) => (profile ? toServiceMaster(profile, offers, true) : undefined),
);

export const selectCatalogMasters = createSelector(
  [
    (state: RootState) => state.servicesCatalog.items,
    selectOwnMaster,
    (state: RootState) => state.auth.userId,
  ],
  function selectCatalogMastersResult(remote, own, userId) {
    const items = remote.filter((item) => !isOwnCatalogEntry(item.id, item.email, own, userId));
    if (own?.displayName.trim()) return [own, ...items];
    return items;
  },
);

export const selectMasterById = createSelector(
  [
    (state: RootState) => state.servicesCatalog.items,
    selectOwnMaster,
    (state: RootState) => state.auth.userId,
    (_state: RootState, id: string) => id,
  ],
  function selectMasterByIdResult(items, own, userId, id) {
    if (!id) return undefined;
    if (isOwnCatalogEntry(id, undefined, own, userId)) return own;
    return items.find((item) => item.id === id);
  },
);

export const selectOfferView = createSelector(
  [selectCatalogMasters, (_state: RootState, offerId: string) => offerId],
  function selectOfferViewResult(masters, offerId) {
    if (!offerId) return undefined;
    for (const master of masters) {
      const offer = master.offers.find((item) => item.id === offerId);
      if (offer) return { master, offer };
    }
    return undefined;
  },
);

export const selectRecentErrors = createSelector([(state: RootState) => state.jobs.feeds], (feeds) => {
  const seen = new Set<string>();
  const out: SourceError[] = [];
  for (const feed of Object.values(feeds)) {
    for (const error of feed?.errors ?? []) {
      if (!error?.sourceName || !error?.message || !error?.sourceId) continue;
      const key = `${error.sourceId}:${error.message}`;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(error);
      if (out.length >= 6) return out;
    }
  }
  return out.length ? out : EMPTY_ERRORS;
});

export const selectTodayCard = createSelector(
  [
    (state: RootState) => state.alerts.items,
    (state: RootState) => state.saved.items,
    (state: RootState) => state.saved.statuses,
    (state: RootState) => state.saved.statusAt,
  ],
  (alerts, savedJobs, statuses, statusAt) => todayCard({ alerts, savedJobs, statuses, statusAt }),
);

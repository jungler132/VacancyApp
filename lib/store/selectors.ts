import { createSelector } from '@reduxjs/toolkit';

import { enabledSourceIds } from '@/lib/api/aggregator';
import { apiCategory } from '@/lib/catalog';
import { extraFiltersActive, filterFeedIds } from '@/lib/filters';
import { computeJobStats } from '@/lib/stats';
import type { Job } from '@/lib/types';
import type { RootState } from './index';
import { makeFeedKey, type FeedCache } from './jobsSlice';
import type { CategoryId, RegionId, SourceError } from '@/lib/types';

const EMPTY_IDS: string[] = [];
const EMPTY_JOBS: Job[] = [];

const emptyFeed: FeedCache = {
  ids: [],
  page: 0,
  hasMore: false,
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

export const selectVisibleIds = createSelector(
  [
    selectActiveFeed,
    (state: RootState) => state.jobs.byId,
    (state: RootState) => state.filters.categories,
    (state: RootState) => state.filters.extra,
  ],
  (feed, byId, categories, extra) => filterFeedIds(feed.ids.length ? feed.ids : EMPTY_IDS, byId, categories, extra),
);

export const selectVisibleCount = createSelector([selectVisibleIds], (ids) => ids.length);

export const selectVisibleJobs = createSelector(
  [selectVisibleIds, (state: RootState) => state.jobs.byId],
  (ids, byId) => {
    if (!ids.length) return EMPTY_JOBS;
    return ids.map((id) => byId[id]).filter(Boolean);
  },
);

export const selectJobStats = createSelector([selectVisibleJobs], computeJobStats);

export const selectFiltersActive = createSelector([(state: RootState) => state.filters], (filters) => {
  if (!filters) return false;
  return (
    extraFiltersActive(filters.extra) ||
    filters.categories.length > 1 ||
    filters.categories[0] !== 'all' ||
    filters.region !== 'cis'
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

export const selectJobById = (id: string) => (state: RootState) =>
  state.jobs.byId[id] ?? state.saved.items.find((item) => item.id === id);

export const selectIsSaved = (id: string) => (state: RootState) =>
  state.saved.items.some((item) => item.id === id);

export const selectSavedIdSet = createSelector(
  [(state: RootState) => state.saved.items],
  (items) => new Set(items.map((item) => item.id)),
);

const EMPTY_ERRORS: SourceError[] = [];

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

import { createSelector } from '@reduxjs/toolkit';

import type { RootState } from './index';
import { makeFeedKey, type FeedCache } from './jobsSlice';
import type { CategoryId, RegionId, SourceError } from '@/lib/types';

const emptyFeed: FeedCache = {
  ids: [],
  page: 0,
  hasMore: false,
  errors: [],
  fetchedAt: 0,
  status: 'idle',
};

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

import { useCallback, useEffect, useRef } from 'react';

import { apiCategory } from '@/lib/catalog';
import {
  closeFilters,
  openFilters,
  resetFilters,
  setExtra,
  setQuery,
  setRegion,
  toggleFilterCategory,
} from '@/lib/store/filtersSlice';
import { CACHE_TTL_MS, clearJobsCache, fetchFeed } from '@/lib/store/jobsSlice';
import { useAppDispatch, useAppSelector } from '@/lib/store/hooks';
import {
  selectActiveFeed,
  selectEnabledSources,
  selectFiltersActive,
  selectVisibleIds,
} from '@/lib/store/selectors';
import { DEFAULT_EXTRA_FILTERS, type ExtraFilters } from '@/lib/filters';
import type { CategoryId, RegionId } from '@/lib/types';

export function useJobsQuery() {
  const dispatch = useAppDispatch();
  const query = useAppSelector((state) => state.filters.query);
  const region = useAppSelector((state) => state.filters.region);
  const categories = useAppSelector((state) => state.filters.categories);
  const enabledSources = useAppSelector(selectEnabledSources);
  const sourcesReady = useAppSelector((state) => state.sources.ready);
  const category = apiCategory(categories);

  useEffect(() => {
    if (!sourcesReady) return;
    const action = dispatch(
      fetchFeed({
        query,
        region,
        category,
        enabledSources,
        page: 0,
        mode: 'replace',
      }),
    );
    return () => action.abort();
  }, [dispatch, query, region, category, enabledSources, sourcesReady]);
}

export function useFilterSheet() {
  const dispatch = useAppDispatch();
  const open = useAppSelector((state) => state.filters.sheetOpen);
  const query = useAppSelector((state) => state.filters.query);
  const region = useAppSelector((state) => state.filters.region);
  const categories = useAppSelector((state) => state.filters.categories);
  const extra = useAppSelector((state) => state.filters.extra);

  return {
    open,
    region,
    categories,
    extra: extra ?? DEFAULT_EXTRA_FILTERS,
    query,
    setRegion: useCallback((value: RegionId) => dispatch(setRegion(value)), [dispatch]),
    onToggleCategory: useCallback((id: CategoryId) => dispatch(toggleFilterCategory(id)), [dispatch]),
    setExtra: useCallback((value: ExtraFilters) => dispatch(setExtra(value)), [dispatch]),
    onClose: useCallback(() => dispatch(closeFilters()), [dispatch]),
    onReset: useCallback(() => dispatch(resetFilters()), [dispatch]),
  };
}

export function useJobsFeed() {
  const dispatch = useAppDispatch();
  const endLock = useRef(false);
  const query = useAppSelector((state) => state.filters.query);
  const region = useAppSelector((state) => state.filters.region);
  const categories = useAppSelector((state) => state.filters.categories);
  const enabledSources = useAppSelector(selectEnabledSources);
  const feed = useAppSelector(selectActiveFeed);
  const visibleIds = useAppSelector(selectVisibleIds);
  const filtersActive = useAppSelector(selectFiltersActive);
  const category = apiCategory(categories);

  const ids = feed.ids;
  const status = feed.status;
  const hasMore = feed.hasMore;
  const page = feed.page;
  const loading = ids.length === 0 && (status === 'loading' || status === 'idle');
  const loadingMore = status === 'loadingMore';
  const refreshing = status === 'refreshing';
  const cacheAge = feed.fetchedAt ? Date.now() - feed.fetchedAt : 0;
  const fromCache = status === 'ready' && cacheAge > 1500 && cacheAge < CACHE_TTL_MS;

  const refresh = useCallback(() => {
    dispatch(
      fetchFeed({
        query,
        region,
        category,
        enabledSources,
        page: 0,
        mode: 'refresh',
      }),
    );
  }, [dispatch, query, region, category, enabledSources]);

  const loadMore = useCallback(() => {
    if (endLock.current || !hasMore || status !== 'ready') return;
    endLock.current = true;
    dispatch(
      fetchFeed({
        query,
        region,
        category,
        enabledSources,
        page: page + 1,
        mode: 'append',
      }),
    ).finally(() => {
      endLock.current = false;
    });
  }, [dispatch, query, region, category, enabledSources, hasMore, page, status]);

  const resetCache = useCallback(() => {
    dispatch(clearJobsCache());
    dispatch(
      fetchFeed({
        query,
        region,
        category,
        enabledSources,
        page: 0,
        mode: 'refresh',
      }),
    );
  }, [dispatch, query, region, category, enabledSources]);

  return {
    query,
    setQuery: useCallback((value: string) => dispatch(setQuery(value)), [dispatch]),
    filtersActive,
    visibleIds,
    status,
    loading,
    loadingMore,
    refreshing,
    fromCache,
    refresh,
    loadMore,
    resetCache,
    openSheet: useCallback(() => dispatch(openFilters()), [dispatch]),
    resetFilters: useCallback(() => dispatch(resetFilters()), [dispatch]),
  };
}

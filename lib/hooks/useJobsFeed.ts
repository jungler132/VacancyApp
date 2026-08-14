import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { enabledSourceIds } from '@/lib/api/aggregator';
import { apiCategory, toggleCategory } from '@/lib/catalog';
import {
  DEFAULT_EXTRA_FILTERS,
  extraFiltersActive,
  filterFeedIds,
  type AgeFilter,
  type ExtraFilters,
} from '@/lib/filters';
import { CACHE_TTL_MS, clearJobsCache, fetchFeed, makeFeedKey } from '@/lib/store/jobsSlice';
import { useAppDispatch, useAppSelector } from '@/lib/store/hooks';
import type { CategoryId, RegionId } from '@/lib/types';

const EMPTY_IDS: string[] = [];

export function useJobsFeed() {
  const dispatch = useAppDispatch();
  const endLock = useRef(false);
  const [query, setQuery] = useState('');
  const [region, setRegion] = useState<RegionId>('cis');
  const [categories, setCategories] = useState<CategoryId[]>(['all']);
  const [extra, setExtra] = useState<ExtraFilters>(DEFAULT_EXTRA_FILTERS);
  const [sheetOpen, setSheetOpen] = useState(false);

  const category = apiCategory(categories);
  const disabledIds = useAppSelector((state) => state.sources.disabledIds);
  const enabledSources = useMemo(() => enabledSourceIds(disabledIds), [disabledIds]);
  const key = useMemo(
    () => makeFeedKey(query, region, category, enabledSources),
    [query, region, category, enabledSources],
  );
  const feed = useAppSelector((state) => state.jobs.feeds[key]);
  const byId = useAppSelector((state) => state.jobs.byId);
  const ids = feed?.ids ?? EMPTY_IDS;
  const status = feed?.status ?? 'idle';
  const hasMore = feed?.hasMore ?? false;
  const page = feed?.page ?? 0;

  const visibleIds = useMemo(
    () => filterFeedIds(ids, byId, categories, extra),
    [ids, byId, categories, extra],
  );

  const loading = status === 'loading' && ids.length === 0;
  const loadingMore = status === 'loadingMore';
  const refreshing = status === 'refreshing';
  const cacheAge = feed?.fetchedAt ? Date.now() - feed.fetchedAt : 0;
  const fromCache = status === 'ready' && cacheAge > 1500 && cacheAge < CACHE_TTL_MS;
  const filtersActive =
    extraFiltersActive(extra) || categories.length > 1 || categories[0] !== 'all' || region !== 'cis';

  useEffect(() => {
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
  }, [dispatch, query, region, category, enabledSources]);

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

  const onToggleCategory = useCallback((id: CategoryId) => {
    setCategories((current) => toggleCategory(current, id));
  }, []);

  const setMaxAgeDays = useCallback((maxAgeDays: AgeFilter) => {
    setExtra((current) => (current.maxAgeDays === maxAgeDays ? current : { ...current, maxAgeDays }));
  }, []);

  const openSheet = useCallback(() => setSheetOpen(true), []);
  const closeSheet = useCallback(() => setSheetOpen(false), []);

  const resetFilters = useCallback(() => {
    setCategories(['all']);
    setExtra(DEFAULT_EXTRA_FILTERS);
    setRegion('cis');
  }, []);

  return {
    query,
    setQuery,
    region,
    setRegion,
    categories,
    extra,
    setExtra,
    setMaxAgeDays,
    sheetOpen,
    openSheet,
    closeSheet,
    visibleIds,
    status,
    loading,
    loadingMore,
    refreshing,
    fromCache,
    filtersActive,
    refresh,
    loadMore,
    resetCache,
    onToggleCategory,
    resetFilters,
  };
}

import { configureStore, createListenerMiddleware, isAnyOf } from '@reduxjs/toolkit';

import { apiCategory } from '@/lib/catalog';
import { filterFeedIds } from '@/lib/filters';
import jobsReducer, {
  clearJobsCache,
  fetchFeed,
  pruneUnreferencedJobs,
  rememberJobs,
} from './jobsSlice';
import savedReducer, { hydrateSaved, persistSaved, setApplyStatus, toggleSaved } from './savedSlice';
import sourcesReducer, { hydrateSources, persistDisabledSources, toggleSource } from './sourcesSlice';
import filtersReducer, {
  applySearch,
  hydrateFilters,
  persistFilters,
  resetFilters,
  setExtra,
  setMaxAgeDays,
  setQuery,
  setRegion,
  toggleFilterCategory,
} from './filtersSlice';
import alertsReducer, { hydrateAlerts, rememberSeen, removeSearch, saveSearch, toggleSearch } from './alertsSlice';
import { persistAlerts } from '@/lib/alerts';

const listener = createListenerMiddleware();

listener.startListening({
  matcher: isAnyOf(toggleSaved, setApplyStatus, hydrateSaved.fulfilled),
  effect: async (action, listenerApi) => {
    const saved = (listenerApi.getState() as RootState).saved;
    listenerApi.dispatch(rememberJobs(saved.items));
    if (toggleSaved.match(action) || setApplyStatus.match(action)) {
      await persistSaved(saved.items, saved.statuses);
    }
  },
});

listener.startListening({
  actionCreator: toggleSource,
  effect: async (_action, listenerApi) => {
    const ids = (listenerApi.getState() as RootState).sources.disabledIds;
    await persistDisabledSources(ids);
  },
});

listener.startListening({
  matcher: isAnyOf(saveSearch, removeSearch, toggleSearch, rememberSeen),
  effect: async (_action, listenerApi) => {
    const items = (listenerApi.getState() as RootState).alerts.items;
    await persistAlerts(items);
  },
});

listener.startListening({
  matcher: isAnyOf(setQuery, setRegion, setExtra, setMaxAgeDays, toggleFilterCategory, resetFilters, applySearch),
  effect: async (_action, listenerApi) => {
    const filters = (listenerApi.getState() as RootState).filters;
    if (!filters.ready) return;
    await persistFilters(filters);
  },
});

listener.startListening({
  matcher: isAnyOf(fetchFeed.pending, fetchFeed.fulfilled, fetchFeed.rejected, clearJobsCache),
  effect: (_action, listenerApi) => {
    const savedIds = (listenerApi.getState() as RootState).saved.items.map((item) => item.id);
    listenerApi.dispatch(pruneUnreferencedJobs(savedIds));
  },
});

listener.startListening({
  actionCreator: fetchFeed.fulfilled,
  effect: (action, listenerApi) => {
    if (action.meta.arg.mode === 'append') return;
    const state = listenerApi.getState() as RootState;
    const { query, region, category } = action.meta.arg;
    const byId = { ...state.jobs.byId };
    for (const job of action.payload.jobs) byId[job.id] = job;
    const feedIds = action.payload.jobs.map((job) => job.id);
    for (const alert of state.alerts.items) {
      if (!alert.enabled) continue;
      if (alert.region !== region) continue;
      if (alert.query.trim().toLowerCase() !== query.trim().toLowerCase()) continue;
      if (apiCategory(alert.categories) !== category) continue;
      const ids = filterFeedIds(feedIds, byId, alert.categories, alert.extra);
      const merged = [...ids, ...alert.lastSeenIds.filter((id) => !ids.includes(id))];
      listenerApi.dispatch(rememberSeen({ id: alert.id, ids: merged }));
    }
  },
});

export const store = configureStore({
  reducer: {
    jobs: jobsReducer,
    saved: savedReducer,
    sources: sourcesReducer,
    filters: filtersReducer,
    alerts: alertsReducer,
  },
  middleware: (getDefault) =>
    getDefault({
      serializableCheck: {
        ignoredActionPaths: ['meta.arg.signal', 'meta.abort'],
      },
    }).prepend(listener.middleware),
});

store.dispatch(hydrateSaved());
store.dispatch(hydrateSources());
store.dispatch(hydrateFilters());
store.dispatch(hydrateAlerts());

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

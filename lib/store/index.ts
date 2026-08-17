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
import savedCatalogReducer, {
  hydrateSavedCatalog,
  persistSavedCatalog,
  toggleSavedCatalog,
} from './savedCatalogSlice';
import sourcesReducer, { hydrateSources, persistDisabledSources, toggleSource } from './sourcesSlice';
import localJobsReducer, {
  hydrateLocalJobs,
  persistLocalJobs,
  removeLocalJob,
  upsertLocalJob,
} from './localJobsSlice';
import premiumReducer, { hydratePremium } from './premiumSlice';
import appearanceReducer, {
  hydrateAppearance,
  persistAppearance,
  setFontSize,
  setLocale,
} from './appearanceSlice';
import visitsReducer, { hydrateVisits, persistVisits, recordVisit } from './visitsSlice';
import freelanceReducer, {
  hydrateFreelance,
  persistFreelance,
  removeOffer,
  saveProfile,
  upsertOffer,
} from './freelanceSlice';
import servicesCatalogReducer from './servicesCatalogSlice';
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
  matcher: isAnyOf(toggleSavedCatalog, hydrateSavedCatalog.fulfilled),
  effect: async (action, listenerApi) => {
    const items = (listenerApi.getState() as RootState).savedCatalog.items;
    if (toggleSavedCatalog.match(action)) {
      await persistSavedCatalog(items);
    }
  },
});

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
  matcher: isAnyOf(upsertLocalJob, removeLocalJob, hydrateLocalJobs.fulfilled),
  effect: async (action, listenerApi) => {
    const items = (listenerApi.getState() as RootState).localJobs.items;
    listenerApi.dispatch(rememberJobs(items));
    if (upsertLocalJob.match(action) || removeLocalJob.match(action)) {
      await persistLocalJobs(items);
    }
  },
});

listener.startListening({
  matcher: isAnyOf(fetchFeed.pending, fetchFeed.fulfilled, fetchFeed.rejected, clearJobsCache),
  effect: (_action, listenerApi) => {
    const state = listenerApi.getState() as RootState;
    const savedIds = state.saved.items.map((item) => item.id);
    const localIds = state.localJobs.items.map((item) => item.id);
    listenerApi.dispatch(pruneUnreferencedJobs([...savedIds, ...localIds]));
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

listener.startListening({
  matcher: isAnyOf(setFontSize, setLocale, hydrateAppearance.fulfilled),
  effect: async (_action, listenerApi) => {
    const appearance = (listenerApi.getState() as RootState).appearance;
    await persistAppearance(appearance.fontSize, appearance.locale);
  },
});

listener.startListening({
  actionCreator: recordVisit,
  effect: async (_action, listenerApi) => {
    await persistVisits((listenerApi.getState() as RootState).visits.items);
  },
});

listener.startListening({
  matcher: isAnyOf(saveProfile, upsertOffer, removeOffer, hydrateFreelance.fulfilled),
  effect: async (action, listenerApi) => {
    if (!saveProfile.match(action) && !upsertOffer.match(action) && !removeOffer.match(action)) return;
    const freelance = (listenerApi.getState() as RootState).freelance;
    await persistFreelance(freelance.profile, freelance.offers);
  },
});

export const store = configureStore({
  reducer: {
    jobs: jobsReducer,
    saved: savedReducer,
    savedCatalog: savedCatalogReducer,
    sources: sourcesReducer,
    filters: filtersReducer,
    alerts: alertsReducer,
    localJobs: localJobsReducer,
    premium: premiumReducer,
    appearance: appearanceReducer,
    freelance: freelanceReducer,
    servicesCatalog: servicesCatalogReducer,
    visits: visitsReducer,
  },
  middleware: (getDefault) =>
    getDefault({
      serializableCheck: {
        ignoredActionPaths: ['meta.arg.signal', 'meta.abort'],
      },
    }).prepend(listener.middleware),
});

store.dispatch(hydrateSaved());
store.dispatch(hydrateSavedCatalog());
store.dispatch(hydrateSources());
store.dispatch(hydrateFilters());
store.dispatch(hydrateAlerts());
store.dispatch(hydrateLocalJobs());
store.dispatch(hydratePremium());
store.dispatch(hydrateAppearance());
store.dispatch(hydrateFreelance());
store.dispatch(hydrateVisits());

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

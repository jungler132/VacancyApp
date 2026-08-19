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
  setTheme,
} from './appearanceSlice';
import visitsReducer, { clearVisits, hydrateVisits, persistVisits, recordVisit, removeVisit } from './visitsSlice';
import freelanceReducer, {
  applyRemoteMedia,
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
import alertsReducer, {
  clearPendingNew,
  hydrateAlerts,
  rememberSeen,
  removeSearch,
  saveSearch,
  toggleSearch,
} from './alertsSlice';
import identityReducer, {
  hydrateIdentity,
  persistIdentity,
  savePrefs,
  toggleAvailable,
  toggleFormat,
  toggleSeeking,
} from './identitySlice';
import authReducer, { hydrateAuth } from './authSlice';
import { makeAlertKey, persistAlerts } from '@/lib/alerts';
import { deleteRemoteJob, deleteRemoteOffer, schedulePush } from '@/lib/backend/sync';

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
      await persistSaved(saved.items, saved.statuses, saved.statusAt);
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
  matcher: isAnyOf(saveSearch, removeSearch, toggleSearch, rememberSeen, clearPendingNew),
  effect: async (_action, listenerApi) => {
    const items = (listenerApi.getState() as RootState).alerts.items;
    await persistAlerts(items);
  },
});

listener.startListening({
  actionCreator: applySearch,
  effect: (_action, listenerApi) => {
    const state = listenerApi.getState() as RootState;
    const key = makeAlertKey(state.filters);
    const alert = state.alerts.items.find((item) => item.enabled && makeAlertKey(item) === key);
    if (alert?.pendingNew) listenerApi.dispatch(clearPendingNew(alert.id));
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
      const state = listenerApi.getState() as RootState;
      if (removeLocalJob.match(action) && state.auth.userId) {
        await deleteRemoteJob(state.auth.userId, action.payload);
      }
      if (state.auth.userId) schedulePush(() => listenerApi.getState() as RootState, listenerApi.dispatch);
    }
  },
});

listener.startListening({
  matcher: isAnyOf(fetchFeed.fulfilled, fetchFeed.rejected, clearJobsCache),
  effect: (_action, listenerApi) => {
    const state = listenerApi.getState() as RootState;
    const savedIds = state.saved.items.map((item) => item.id);
    const localIds = state.localJobs.items.map((item) => item.id);
    listenerApi.dispatch(pruneUnreferencedJobs([...savedIds, ...localIds, ...state.jobs.todayIds, ...state.jobs.worklyPublicIds]));
  },
});

listener.startListening({
  actionCreator: fetchFeed.fulfilled,
  effect: (action, listenerApi) => {
    if (action.meta.arg.mode === 'append') return;
    const state = listenerApi.getState() as RootState;
    const { query, region, category } = action.meta.arg;
    const byId = state.jobs.byId;
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
  matcher: isAnyOf(setFontSize, setLocale, setTheme, hydrateAppearance.fulfilled),
  effect: async (_action, listenerApi) => {
    const appearance = (listenerApi.getState() as RootState).appearance;
    await persistAppearance(appearance.fontSize, appearance.locale, appearance.theme);
  },
});

listener.startListening({
  matcher: isAnyOf(recordVisit, removeVisit, clearVisits),
  effect: async (_action, listenerApi) => {
    await persistVisits((listenerApi.getState() as RootState).visits.items);
  },
});

listener.startListening({
  matcher: isAnyOf(saveProfile, upsertOffer, removeOffer, applyRemoteMedia),
  effect: async (action, listenerApi) => {
    const freelance = (listenerApi.getState() as RootState).freelance;
    await persistFreelance(freelance.profile, freelance.offers);
    if (applyRemoteMedia.match(action)) return;
    const state = listenerApi.getState() as RootState;
    if (removeOffer.match(action) && state.auth.userId) {
      await deleteRemoteOffer(state.auth.userId, action.payload);
    }
    if (state.auth.userId) schedulePush(() => listenerApi.getState() as RootState, listenerApi.dispatch);
  },
});

listener.startListening({
  matcher: isAnyOf(toggleSeeking, toggleAvailable, toggleFormat, savePrefs),
  effect: async (_action, listenerApi) => {
    const identity = (listenerApi.getState() as RootState).identity;
    await persistIdentity({
      seeking: identity.seeking,
      available: identity.available,
      title: identity.title,
      format: identity.format,
    });
    if ((listenerApi.getState() as RootState).auth.userId) {
      schedulePush(() => listenerApi.getState() as RootState, listenerApi.dispatch);
    }
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
    identity: identityReducer,
    auth: authReducer,
  },
  middleware: (getDefault) =>
    getDefault({
      serializableCheck: {
        ignoredActionPaths: ['meta.arg.signal', 'meta.abort', 'payload.session'],
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
store.dispatch(hydrateIdentity());
store.dispatch(hydrateAuth());

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

import { configureStore, createListenerMiddleware, isAnyOf } from '@reduxjs/toolkit';

import { isAbortError } from '@/lib/api/errors';
import { apiCategory } from '@/lib/catalog';
import { filterFeedIds } from '@/lib/filters';
import jobsReducer, {
  clearJobsCache,
  fetchFeed,
  pruneUnreferencedJobs,
  rememberJobs,
} from './jobsSlice';
import savedReducer, { hydrateSaved, persistSaved, replaceSaved, setApplyStatus, toggleSaved } from './savedSlice';
import savedCatalogReducer, {
  hydrateSavedCatalog,
  persistSavedCatalog,
  replaceSavedCatalog,
  toggleSavedCatalog,
} from './savedCatalogSlice';
import savedServicesReducer, {
  hydrateSavedServices,
  persistSavedServices,
  replaceSavedServices,
  toggleSavedService,
} from './savedServicesSlice';
import sourcesReducer, { hydrateSources, persistDisabledSources, replaceDisabledSources, toggleSource } from './sourcesSlice';
import localJobsReducer, {
  hydrateLocalJobs,
  persistLocalJobs,
  removeLocalJob,
  replaceLocalJobs,
  setLocalJobArchived,
  stampCompanyOnJobs,
  upsertLocalJob,
} from './localJobsSlice';
import companyReducer, {
  applyCompanyLogo,
  hydrateCompany,
  persistCompany,
  replaceCompany,
  resetCompany,
  saveCompany,
} from './companySlice';
import premiumReducer, { hydratePremium } from './premiumSlice';
import appearanceReducer, {
  hydrateAppearance,
  persistAppearance,
  replaceAppearance,
  setFontSize,
  setLocale,
  setTheme,
} from './appearanceSlice';
import onboardingReducer, { hydrateOnboarding } from './onboardingSlice';
import visitsReducer, { clearVisits, hydrateVisits, persistVisits, recordVisit, removeVisit, replaceVisits } from './visitsSlice';
import freelanceReducer, {
  applyRemoteMedia,
  hydrateFreelance,
  persistFreelance,
  removeOffer,
  replaceAccount,
  saveProfile,
  setOfferArchived,
  upsertOffer,
} from './freelanceSlice';
import servicesCatalogReducer from './servicesCatalogSlice';
import filtersReducer, {
  applySearch,
  hydrateFilters,
  persistFilters,
  replaceFilters,
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
  replaceAlerts,
  saveSearch,
  toggleSearch,
} from './alertsSlice';
import identityReducer, {
  hydrateIdentity,
  persistIdentity,
  resetIdentity,
  savePrefs,
  toggleAvailable,
  toggleFormat,
  toggleSeeking,
} from './identitySlice';
import authReducer, { hydrateAuth } from './authSlice';
import { makeAlertKey, persistAlerts } from '@/lib/alerts';
import { deleteRemoteJob, deleteRemoteOffer, schedulePush } from '@/lib/backend/sync';

function canPush(state: { auth: { userId: string | null; email: string | null; anonymous: boolean } }) {
  return Boolean(state.auth.userId && !state.auth.anonymous);
}

const listener = createListenerMiddleware();

listener.startListening({
  matcher: isAnyOf(toggleSavedCatalog, hydrateSavedCatalog.fulfilled, replaceSavedCatalog),
  effect: async (action, listenerApi) => {
    const items = (listenerApi.getState() as RootState).savedCatalog.items;
    if (toggleSavedCatalog.match(action) || replaceSavedCatalog.match(action)) {
      await persistSavedCatalog(items);
    }
    if (toggleSavedCatalog.match(action) && canPush(listenerApi.getState() as RootState)) {
      schedulePush(() => listenerApi.getState() as RootState, listenerApi.dispatch);
    }
  },
});

listener.startListening({
  matcher: isAnyOf(toggleSavedService, hydrateSavedServices.fulfilled, replaceSavedServices),
  effect: async (action, listenerApi) => {
    const items = (listenerApi.getState() as RootState).savedServices.items;
    if (toggleSavedService.match(action) || replaceSavedServices.match(action)) {
      await persistSavedServices(items);
    }
    if (toggleSavedService.match(action) && canPush(listenerApi.getState() as RootState)) {
      schedulePush(() => listenerApi.getState() as RootState, listenerApi.dispatch);
    }
  },
});

listener.startListening({
  matcher: isAnyOf(toggleSaved, setApplyStatus, hydrateSaved.fulfilled, replaceSaved),
  effect: async (action, listenerApi) => {
    const saved = (listenerApi.getState() as RootState).saved;
    listenerApi.dispatch(rememberJobs(saved.items));
    if (toggleSaved.match(action) || setApplyStatus.match(action) || replaceSaved.match(action)) {
      await persistSaved(saved.items, saved.statuses, saved.statusAt);
    }
    if ((toggleSaved.match(action) || setApplyStatus.match(action)) && canPush(listenerApi.getState() as RootState)) {
      schedulePush(() => listenerApi.getState() as RootState, listenerApi.dispatch);
    }
  },
});

listener.startListening({
  matcher: isAnyOf(toggleSource, replaceDisabledSources),
  effect: async (action, listenerApi) => {
    const ids = (listenerApi.getState() as RootState).sources.disabledIds;
    await persistDisabledSources(ids);
    if (toggleSource.match(action) && canPush(listenerApi.getState() as RootState)) {
      schedulePush(() => listenerApi.getState() as RootState, listenerApi.dispatch);
    }
  },
});

listener.startListening({
  matcher: isAnyOf(saveSearch, removeSearch, toggleSearch, rememberSeen, clearPendingNew, replaceAlerts),
  effect: async (action, listenerApi) => {
    const items = (listenerApi.getState() as RootState).alerts.items;
    await persistAlerts(items);
    if (!replaceAlerts.match(action) && canPush(listenerApi.getState() as RootState)) {
      schedulePush(() => listenerApi.getState() as RootState, listenerApi.dispatch);
    }
  },
});

listener.startListening({
  actionCreator: applySearch,
  effect: (_action, listenerApi) => {
    const state = listenerApi.getState() as RootState;
    const key = makeAlertKey(state.filters);
    const alert = state.alerts.items.find((item) => item.enabled && makeAlertKey(item) === key);
    if (alert?.pendingNew || alert?.pendingNewIds?.length) listenerApi.dispatch(clearPendingNew(alert.id));
  },
});

listener.startListening({
  matcher: isAnyOf(setQuery, setRegion, setExtra, setMaxAgeDays, toggleFilterCategory, resetFilters, applySearch, replaceFilters),
  effect: async (action, listenerApi) => {
    const filters = (listenerApi.getState() as RootState).filters;
    if (!filters.ready) return;
    await persistFilters(filters);
    if (!replaceFilters.match(action) && canPush(listenerApi.getState() as RootState)) {
      schedulePush(() => listenerApi.getState() as RootState, listenerApi.dispatch);
    }
  },
});

listener.startListening({
  matcher: isAnyOf(upsertLocalJob, removeLocalJob, hydrateLocalJobs.fulfilled, replaceLocalJobs, stampCompanyOnJobs, setLocalJobArchived),
  effect: async (action, listenerApi) => {
    const items = (listenerApi.getState() as RootState).localJobs.items;
    listenerApi.dispatch(rememberJobs(items));
    if (replaceLocalJobs.match(action)) {
      await persistLocalJobs(items);
      return;
    }
    if (stampCompanyOnJobs.match(action)) {
      await persistLocalJobs(items);
      return;
    }
    if (upsertLocalJob.match(action) || removeLocalJob.match(action) || setLocalJobArchived.match(action)) {
      await persistLocalJobs(items);
      const state = listenerApi.getState() as RootState;
      if (removeLocalJob.match(action) && state.auth.userId) {
        await deleteRemoteJob(state.auth.userId, action.payload);
      }
      if (canPush(state)) schedulePush(() => listenerApi.getState() as RootState, listenerApi.dispatch);
    }
  },
});

listener.startListening({
  matcher: isAnyOf(fetchFeed.fulfilled, fetchFeed.rejected, clearJobsCache),
  effect: (action, listenerApi) => {
    if (fetchFeed.rejected.match(action) && isAbortError(action.error)) return;
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
  matcher: isAnyOf(setFontSize, setLocale, setTheme, hydrateAppearance.fulfilled, replaceAppearance),
  effect: async (action, listenerApi) => {
    const appearance = (listenerApi.getState() as RootState).appearance;
    await persistAppearance(appearance.fontSize, appearance.locale, appearance.theme);
    if (
      (setFontSize.match(action) || setLocale.match(action) || setTheme.match(action)) &&
      canPush(listenerApi.getState() as RootState)
    ) {
      schedulePush(() => listenerApi.getState() as RootState, listenerApi.dispatch);
    }
  },
});

listener.startListening({
  matcher: isAnyOf(recordVisit, removeVisit, clearVisits, replaceVisits),
  effect: async (action, listenerApi) => {
    await persistVisits((listenerApi.getState() as RootState).visits.items);
    if (!replaceVisits.match(action) && canPush(listenerApi.getState() as RootState)) {
      schedulePush(() => listenerApi.getState() as RootState, listenerApi.dispatch);
    }
  },
});

listener.startListening({
  matcher: isAnyOf(saveProfile, upsertOffer, removeOffer, setOfferArchived, applyRemoteMedia, replaceAccount),
  effect: async (action, listenerApi) => {
    const freelance = (listenerApi.getState() as RootState).freelance;
    await persistFreelance(freelance.profile, freelance.offers);
    if (applyRemoteMedia.match(action) || replaceAccount.match(action)) return;
    const state = listenerApi.getState() as RootState;
    if (removeOffer.match(action) && state.auth.userId) {
      await deleteRemoteOffer(state.auth.userId, action.payload);
    }
    if (canPush(state)) schedulePush(() => listenerApi.getState() as RootState, listenerApi.dispatch);
  },
});

listener.startListening({
  matcher: isAnyOf(toggleSeeking, toggleAvailable, toggleFormat, savePrefs, resetIdentity),
  effect: async (action, listenerApi) => {
    const identity = (listenerApi.getState() as RootState).identity;
    await persistIdentity({
      seeking: identity.seeking,
      available: identity.available,
      title: identity.title,
      format: identity.format,
    });
    if (resetIdentity.match(action)) return;
    if (canPush(listenerApi.getState() as RootState)) {
      schedulePush(() => listenerApi.getState() as RootState, listenerApi.dispatch);
    }
  },
});

listener.startListening({
  matcher: isAnyOf(saveCompany, replaceCompany, applyCompanyLogo, resetCompany),
  effect: async (action, listenerApi) => {
    const company = (listenerApi.getState() as RootState).company;
    await persistCompany({ name: company.name, about: company.about, logoUri: company.logoUri });
    if (resetCompany.match(action) || replaceCompany.match(action)) return;
    if (saveCompany.match(action) || applyCompanyLogo.match(action)) {
      listenerApi.dispatch(stampCompanyOnJobs({ name: company.name || undefined, logoUri: company.logoUri }));
    }
    if (applyCompanyLogo.match(action)) return;
    if (canPush(listenerApi.getState() as RootState)) {
      schedulePush(() => listenerApi.getState() as RootState, listenerApi.dispatch);
    }
  },
});

export const store = configureStore({
  reducer: {
    jobs: jobsReducer,
    saved: savedReducer,
    savedCatalog: savedCatalogReducer,
    savedServices: savedServicesReducer,
    sources: sourcesReducer,
    filters: filtersReducer,
    alerts: alertsReducer,
    localJobs: localJobsReducer,
    premium: premiumReducer,
    appearance: appearanceReducer,
    onboarding: onboardingReducer,
    freelance: freelanceReducer,
    servicesCatalog: servicesCatalogReducer,
    visits: visitsReducer,
    identity: identityReducer,
    company: companyReducer,
    auth: authReducer,
  },
  middleware: (getDefault) =>
    getDefault({
      serializableCheck: {
        ignoredActionPaths: ['meta.arg.signal', 'meta.abort', 'payload.session'],
        warnAfter: 128,
      },
      immutableCheck: { warnAfter: 128 },
    }).prepend(listener.middleware),
});

store.dispatch(hydrateSaved());
store.dispatch(hydrateSavedCatalog());
store.dispatch(hydrateSavedServices());
store.dispatch(hydrateSources());
store.dispatch(hydrateFilters());
store.dispatch(hydrateAlerts());
store.dispatch(hydrateLocalJobs());
store.dispatch(hydratePremium());
store.dispatch(hydrateAppearance());
store.dispatch(hydrateOnboarding());
store.dispatch(hydrateFreelance());
store.dispatch(hydrateVisits());
store.dispatch(hydrateIdentity());
store.dispatch(hydrateCompany());
store.dispatch(hydrateAuth());

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

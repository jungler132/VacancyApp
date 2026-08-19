import type { Dispatch } from '@reduxjs/toolkit';

import { savePrefs, resetIdentity } from '@/lib/store/identitySlice';
import { applyRemoteMedia, replaceAccount } from '@/lib/store/freelanceSlice';
import { replaceLocalJobs } from '@/lib/store/localJobsSlice';
import { replaceAppearance } from '@/lib/store/appearanceSlice';
import { replaceSaved } from '@/lib/store/savedSlice';
import { replaceSavedCatalog } from '@/lib/store/savedCatalogSlice';
import { replaceFilters } from '@/lib/store/filtersSlice';
import { replaceAlerts } from '@/lib/store/alertsSlice';
import { replaceDisabledSources } from '@/lib/store/sourcesSlice';
import { replaceVisits } from '@/lib/store/visitsSlice';
import { setRemoteMasters } from '@/lib/store/servicesCatalogSlice';
import { setWorklyPublic } from '@/lib/store/jobsSlice';
import { parseFormat } from '@/lib/prefs';
import { MAX_JOBS, MAX_OFFERS } from '@/lib/limits';
import { t } from '@/lib/i18n';
import { setAuthNotice } from '@/lib/store/authSlice';
import type { Job } from '@/lib/types';
import type { ServiceOffer, ServiceProfile } from '@/lib/services/types';
import { collectAccountState, parseAccountState, type AccountStateBlob } from './accountState';
import { readBoundEmail, writeBoundEmail } from './boundEmail';
import { fetchOwnRows, fetchPublicCatalog, fetchPublicJobs, jobFromRow, offerFromRow, profileFromRow } from './rows';
import { isRemoteUri } from './merge';
import { getSupabase } from './supabase';
import { deleteOfferMedia, uploadMany, uploadMedia } from './storage';

type SyncState = {
  auth: { userId: string | null; email: string | null; anonymous: boolean };
  freelance: { profile: ServiceProfile | null; offers: ServiceOffer[] };
  identity: { seeking: boolean; available: boolean; title: string; format: string };
  localJobs: { items: Job[] };
  appearance: AccountStateBlob['appearance'];
  saved: AccountStateBlob['saved'];
  savedCatalog: { items: AccountStateBlob['savedCatalog'] };
  filters: AccountStateBlob['filters'];
  alerts: { items: AccountStateBlob['alerts'] };
  sources: { disabledIds: string[] };
  visits: { items: AccountStateBlob['visits'] };
};

function deviceBlob(state: SyncState): AccountStateBlob {
  return collectAccountState({
    appearance: state.appearance,
    saved: state.saved,
    savedCatalog: state.savedCatalog.items,
    filters: state.filters,
    alerts: state.alerts.items,
    sources: state.sources,
    visits: state.visits,
  });
}

function applyDeviceBlob(dispatch: Dispatch, blob: AccountStateBlob) {
  dispatch(replaceAppearance(blob.appearance));
  dispatch(replaceSaved(blob.saved));
  dispatch(replaceSavedCatalog(blob.savedCatalog));
  dispatch(replaceFilters(blob.filters));
  dispatch(replaceAlerts(blob.alerts));
  dispatch(replaceDisabledSources(blob.sources));
  dispatch(replaceVisits(blob.visits));
}

let pushTimer: ReturnType<typeof setTimeout> | undefined;
let lastPush = '';
let lastPublic = 0;
let lastPublicUser: string | null = null;
let suppressPush = 0;
let pushLock = Promise.resolve();

function withPushPaused(fn: () => void) {
  suppressPush += 1;
  try {
    fn();
  } finally {
    suppressPush -= 1;
  }
}

export function clearLocalAccount(dispatch: Dispatch) {
  withPushPaused(() => {
    dispatch(replaceAccount({ profile: null, offers: [] }));
    dispatch(replaceLocalJobs([]));
    dispatch(resetIdentity());
    dispatch(replaceSaved({ items: [], statuses: {}, statusAt: {} }));
    dispatch(replaceSavedCatalog([]));
    dispatch(replaceAlerts([]));
    dispatch(replaceVisits([]));
  });
}

export async function refreshPublic(dispatch: Dispatch, userId?: string | null) {
  const now = Date.now();
  const userKey = userId ?? null;
  if (userKey === lastPublicUser && now - lastPublic < 5 * 60 * 1000) return;
  lastPublic = now;
  lastPublicUser = userKey;
  const [masters, jobs] = await Promise.all([fetchPublicCatalog(userId), fetchPublicJobs(userId)]);
  dispatch(setRemoteMasters(masters));
  dispatch(setWorklyPublic(jobs));
}

export async function pullAccount(dispatch: Dispatch, getState: () => SyncState) {
  const state = getState();
  const userId = state.auth.userId;
  const email = state.auth.email?.trim().toLowerCase() || null;
  if (!userId) return;
  const remote = await fetchOwnRows(userId);
  const hasRemote = Boolean(remote.profile);
  const bound = await readBoundEmail();

  if (!hasRemote && bound && email && bound !== email) {
    clearLocalAccount(dispatch);
    await writeBoundEmail(email);
    schedulePush(getState, dispatch);
    return;
  }

  if (!hasRemote) {
    if (email) await writeBoundEmail(email);
    schedulePush(getState, dispatch);
    return;
  }

  const remoteProfile = remote.profile ? profileFromRow(remote.profile, true) : null;
  const rawState = remote.profile?.account_state;
  const hasState = Boolean(rawState && typeof rawState === 'object' && Object.keys(rawState as object).length);
  withPushPaused(() => {
    dispatch(
      replaceAccount({
        profile: remoteProfile,
        offers: remote.offers.map((row) => offerFromRow(row, true)),
      }),
    );
    dispatch(
      savePrefs({
        title: remote.profile?.seek_title ?? '',
        format: parseFormat(remote.profile?.seek_format),
        seeking: remote.profile?.seeking !== false,
        available: Boolean(remote.profile?.available),
      }),
    );
    dispatch(replaceLocalJobs(remote.jobs.map((row) => jobFromRow(row, true))));
    if (hasState) applyDeviceBlob(dispatch, parseAccountState(rawState));
  });
  await writeBoundEmail(email);
  if (!hasState) schedulePush(getState, dispatch);
}

export async function pushAccount(state: SyncState, dispatch?: Dispatch) {
  try {
    await pushAccountInner(state, dispatch);
  } catch (error) {
    console.warn('workly sync', error);
    if (dispatch) {
      dispatch(setAuthNotice(t(state.appearance?.locale ?? 'ru', 'auth.syncFailed')));
    }
    throw error;
  }
}

export async function flushAccount(getState: () => SyncState, dispatch?: Dispatch) {
  cancelPendingPush();
  const next = pushLock
    .catch(() => undefined)
    .then(() => pushAccount(getState(), dispatch));
  pushLock = next.then(() => undefined, () => undefined);
  await next.catch(() => undefined);
}

function isMissingAccountState(message: string) {
  return /account_state|schema cache|Could not find.*account_state/i.test(message);
}

async function pushAccountInner(state: SyncState, dispatch?: Dispatch) {
  const supabase = getSupabase();
  if (!supabase || state.auth.anonymous) return;
  const { data: sessionData } = await supabase.auth.getSession();
  const userId = sessionData.session?.user.id ?? state.auth.userId;
  const email = sessionData.session?.user.email || state.auth.email || '';
  if (!userId) return;
  const profile = state.freelance.profile;
  const identity = state.identity;
  const offers = state.freelance.offers.slice(0, MAX_OFFERS);
  const jobs = state.localJobs.items.slice(0, MAX_JOBS);
  const accountState = deviceBlob(state);
  const payload = JSON.stringify({
    profile: profile?.updatedAt,
    offers: offers.map((item) => item.id + item.updatedAt),
    jobs: jobs.map((item) => item.id + (item.publishedAt ?? '')),
    identity: [identity.seeking, identity.available, identity.title, identity.format],
    accountState,
  });
  if (payload === lastPush) return;

  let avatar = profile?.avatarUri;
  if (avatar) avatar = await uploadMedia(userId, avatar, 'avatar', 'main');
  const uploadedOffers: ServiceOffer[] = [];
  for (const offer of offers) {
    uploadedOffers.push({ ...offer, images: await uploadMany(userId, offer.images, `offers/${offer.id}`) });
  }

  const profileRow = {
    id: userId,
    display_name: profile?.displayName ?? '',
    bio: profile?.bio ?? '',
    avatar_url: avatar && isRemoteUri(avatar) ? avatar : null,
    email: profile?.email || email,
    phone: profile?.phone ?? '',
    kinds: profile?.kinds ?? [],
    custom_kinds: profile?.customKinds ?? [],
    address: profile?.address ?? null,
    hours_open: profile?.hours?.open ?? '09:00',
    hours_close: profile?.hours?.close ?? '18:00',
    hours_days: profile?.hours?.days ?? [1, 2, 3, 4, 5],
    seeking: identity.seeking,
    available: identity.available,
    seek_title: identity.title,
    seek_format: identity.format,
    updated_at: profile?.updatedAt ?? new Date().toISOString(),
    ...(accountState ? { account_state: accountState } : {}),
  };

  let profileRes = await supabase.from('profiles').upsert(profileRow);
  if (profileRes.error && isMissingAccountState(profileRes.error.message)) {
    const { account_state: _omit, ...withoutState } = profileRow;
    profileRes = await supabase.from('profiles').upsert(withoutState);
  }
  if (profileRes.error) throw profileRes.error;

  const offerRes = uploadedOffers.length
    ? await supabase.from('service_offers').upsert(
        uploadedOffers.map((offer) => ({
          id: offer.id,
          user_id: userId,
          title: offer.title,
          description: offer.description,
          price: offer.price ?? null,
          currency: offer.currency,
          images: offer.images.filter(isRemoteUri),
          address: offer.address ?? null,
          phone: offer.phone ?? null,
          kind: offer.kind,
          custom_kind: offer.customKind ?? null,
          featured: Boolean(offer.featured),
          updated_at: offer.updatedAt,
        })),
        { onConflict: 'user_id,id' },
      )
    : { error: null };
  if (offerRes.error) throw offerRes.error;

  const keepOffers = uploadedOffers.map((item) => item.id);
  const staleOffers = await supabase.from('service_offers').select('id').eq('user_id', userId);
  if (staleOffers.error) throw staleOffers.error;
  const dropOffers = (staleOffers.data ?? []).map((row) => row.id).filter((id) => !keepOffers.includes(id));
  if (dropOffers.length) {
    await supabase.from('service_offers').delete().eq('user_id', userId).in('id', dropOffers);
    await Promise.all(dropOffers.map((id) => deleteOfferMedia(userId, id)));
  }

  const jobRes = jobs.length
    ? await supabase.from('workly_jobs').upsert(
        jobs.map((job) => ({
          id: job.id,
          user_id: userId,
          title: job.title,
          company: job.company,
          company_logo: job.companyLogo ?? null,
          location: job.location,
          remote: job.remote,
          salary: job.salary ?? null,
          employment: job.employment ?? null,
          experience: job.experience ?? null,
          schedule: job.schedule ?? null,
          category: job.category ?? null,
          published_at: job.publishedAt ?? null,
          url: job.url,
          excerpt: job.excerpt,
          description: job.description ?? null,
          tier: job.tier === 1 ? 1 : 2,
          contact: job.contact ?? null,
          updated_at: job.publishedAt ?? new Date().toISOString(),
        })),
      )
    : { error: null };
  if (jobRes.error) throw jobRes.error;

  const keepJobs = jobs.map((item) => item.id);
  const staleJobs = await supabase.from('workly_jobs').select('id').eq('user_id', userId);
  if (staleJobs.error) throw staleJobs.error;
  const dropJobs = (staleJobs.data ?? []).map((row) => row.id).filter((id) => !keepJobs.includes(id));
  if (dropJobs.length) {
    await supabase.from('workly_jobs').delete().eq('user_id', userId).in('id', dropJobs);
  }

  const uploadFailed =
    Boolean(profile?.avatarUri && !isRemoteUri(profile.avatarUri) && (!avatar || !isRemoteUri(avatar))) ||
    uploadedOffers.some((offer) => offer.images.some((uri) => uri && !isRemoteUri(uri)));
  if (!uploadFailed) lastPush = payload;
  await writeBoundEmail(state.auth.email);
  if (dispatch) {
    dispatch(
      applyRemoteMedia({
        avatarUri: avatar,
        offers: Object.fromEntries(uploadedOffers.map((offer) => [offer.id, offer.images])),
      }),
    );
  }
}

export function cancelPendingPush() {
  if (pushTimer) {
    clearTimeout(pushTimer);
    pushTimer = undefined;
  }
}

export function schedulePush(getState: () => SyncState, dispatch?: Dispatch) {
  if (suppressPush > 0) return;
  cancelPendingPush();
  pushTimer = setTimeout(() => {
    pushAccount(getState(), dispatch).catch(() => undefined);
  }, 900);
}

export async function deleteRemoteOffer(userId: string, id: string) {
  const supabase = getSupabase();
  if (!supabase) return;
  await supabase.from('service_offers').delete().eq('user_id', userId).eq('id', id);
  await deleteOfferMedia(userId, id);
}

export async function deleteRemoteJob(userId: string, id: string) {
  const supabase = getSupabase();
  if (!supabase) return;
  await supabase.from('workly_jobs').delete().eq('user_id', userId).eq('id', id);
}

export function resetPushCache() {
  cancelPendingPush();
  lastPush = '';
  lastPublic = 0;
  lastPublicUser = null;
}

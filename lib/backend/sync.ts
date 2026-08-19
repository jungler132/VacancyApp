import type { Dispatch } from '@reduxjs/toolkit';

import { savePrefs } from '@/lib/store/identitySlice';
import { applyRemoteMedia, saveProfile, upsertOffer } from '@/lib/store/freelanceSlice';
import { upsertLocalJob } from '@/lib/store/localJobsSlice';
import { setRemoteMasters } from '@/lib/store/servicesCatalogSlice';
import { setWorklyPublic } from '@/lib/store/jobsSlice';
import { MAX_JOBS, MAX_OFFERS } from '@/lib/limits';
import type { Job } from '@/lib/types';
import type { ServiceOffer, ServiceProfile } from '@/lib/services/types';
import { fetchOwnRows, fetchPublicCatalog, fetchPublicJobs, jobFromRow, offerFromRow, profileFromRow } from './rows';
import { isRemoteUri, mergeById, pickNewer } from './merge';
import { getSupabase } from './supabase';
import { deleteOfferMedia, uploadMany, uploadMedia } from './storage';

type SyncState = {
  auth: { userId: string | null; email: string | null };
  freelance: { profile: ServiceProfile | null; offers: ServiceOffer[] };
  identity: { seeking: boolean; available: boolean; title: string; format: string };
  localJobs: { items: Job[] };
};

let pushTimer: ReturnType<typeof setTimeout> | undefined;
let lastPush = '';
let lastPublic = 0;

function jobStamp(job: Job) {
  return { ...job, updatedAt: job.publishedAt };
}

export async function refreshPublic(dispatch: Dispatch, userId?: string | null) {
  const now = Date.now();
  if (now - lastPublic < 5 * 60 * 1000) return;
  lastPublic = now;
  const [masters, jobs] = await Promise.all([fetchPublicCatalog(userId), fetchPublicJobs(userId)]);
  dispatch(setRemoteMasters(masters));
  dispatch(setWorklyPublic(jobs));
}

export async function pullAccount(dispatch: Dispatch, state: SyncState) {
  const userId = state.auth.userId;
  if (!userId) return;
  const remote = await fetchOwnRows(userId);
  const remoteProfile = remote.profile ? profileFromRow(remote.profile, true) : null;
  const profile = pickNewer(state.freelance.profile, remoteProfile);
  if (profile) dispatch(saveProfile(profile));
  if (remote.profile) {
    dispatch(
      savePrefs({
        title: remote.profile.seek_title,
        format: remote.profile.seek_format === 'remote' || remote.profile.seek_format === 'office' ? remote.profile.seek_format : 'any',
        seeking: remote.profile.seeking,
        available: remote.profile.available,
      }),
    );
  }
  const offers = mergeById(state.freelance.offers, remote.offers.map((row) => offerFromRow(row, true))).slice(0, MAX_OFFERS);
  for (const offer of offers) dispatch(upsertOffer(offer));
  const jobs = mergeById(
    state.localJobs.items.map(jobStamp),
    remote.jobs.map((row) => jobStamp(jobFromRow(row, true))),
  ).slice(0, MAX_JOBS);
  for (const job of jobs) dispatch(upsertLocalJob(job));
}

export async function pushAccount(state: SyncState, dispatch?: Dispatch) {
  const supabase = getSupabase();
  const userId = state.auth.userId;
  if (!supabase || !userId) return;
  const profile = state.freelance.profile;
  const identity = state.identity;
  const offers = state.freelance.offers.slice(0, MAX_OFFERS);
  const jobs = state.localJobs.items.slice(0, MAX_JOBS);
  const payload = JSON.stringify({
    profile: profile?.updatedAt,
    offers: offers.map((item) => item.id + item.updatedAt),
    jobs: jobs.map((item) => item.id + (item.publishedAt ?? '')),
    identity: [identity.seeking, identity.available, identity.title, identity.format],
  });
  if (payload === lastPush) return;

  let avatar = profile?.avatarUri;
  if (avatar) avatar = await uploadMedia(userId, avatar, 'avatar', 'main');
  const uploadedOffers: ServiceOffer[] = [];
  for (const offer of offers) {
    uploadedOffers.push({ ...offer, images: await uploadMany(userId, offer.images, `offers/${offer.id}`) });
  }

  const profileRes = await supabase.from('profiles').upsert({
    id: userId,
    display_name: profile?.displayName ?? '',
    bio: profile?.bio ?? '',
    avatar_url: avatar && isRemoteUri(avatar) ? avatar : null,
    email: profile?.email || state.auth.email || '',
    phone: profile?.phone ?? '',
    kinds: profile?.kinds ?? [],
    custom_kinds: profile?.customKinds ?? [],
    address: profile?.address ?? null,
    hours_open: profile?.hours.open ?? '09:00',
    hours_close: profile?.hours.close ?? '18:00',
    hours_days: profile?.hours.days ?? [1, 2, 3, 4, 5],
    seeking: identity.seeking,
    available: identity.available,
    seek_title: identity.title,
    seek_format: identity.format,
    updated_at: profile?.updatedAt ?? new Date().toISOString(),
  });
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
  if (dispatch) {
    dispatch(
      applyRemoteMedia({
        avatarUri: avatar,
        offers: Object.fromEntries(uploadedOffers.map((offer) => [offer.id, offer.images])),
      }),
    );
  }
}

export function schedulePush(getState: () => SyncState, dispatch?: Dispatch) {
  if (pushTimer) clearTimeout(pushTimer);
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
  lastPush = '';
  lastPublic = 0;
}

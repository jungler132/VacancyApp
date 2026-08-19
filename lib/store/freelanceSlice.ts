import AsyncStorage from '@react-native-async-storage/async-storage';
import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit';

import { DEFAULT_HOURS, normalizeClock, parseWeekdays, WEEKDAYS } from '@/lib/services/hours';
import { isServiceKindId } from '@/lib/services/kinds';
import type { ServiceHours, ServiceKindId, ServiceOffer, ServiceProfile } from '@/lib/services/types';

import { MAX_OFFERS, MAX_OFFER_PHOTOS, MAX_PROFILE_PHOTOS } from '@/lib/limits';

export const FREELANCE_KEY = 'workly:freelance:v1';
export const OWN_PROFILE_ID = 'local:me';
export const OFFERS_LIMIT = MAX_OFFERS;
export const OFFER_PHOTOS_LIMIT = MAX_OFFER_PHOTOS;
export const PROFILE_PHOTOS_LIMIT = MAX_PROFILE_PHOTOS;
export const CUSTOM_KINDS_LIMIT = 8;

export type FreelanceState = {
  profile: ServiceProfile | null;
  offers: ServiceOffer[];
  ready: boolean;
};

function parseHours(raw: unknown): ServiceHours {
  if (!raw || typeof raw !== 'object') return { ...DEFAULT_HOURS, days: [...DEFAULT_HOURS.days] };
  const row = raw as Partial<ServiceHours>;
  return {
    open: normalizeClock(row.open, DEFAULT_HOURS.open),
    close: normalizeClock(row.close, DEFAULT_HOURS.close),
    days: parseWeekdays(row.days, WEEKDAYS),
  };
}

const initialState: FreelanceState = {
  profile: null,
  offers: [],
  ready: false,
};

function asString(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

function parseKinds(raw: unknown): ServiceKindId[] {
  if (!Array.isArray(raw)) return [];
  const seen = new Set<ServiceKindId>();
  const out: ServiceKindId[] = [];
  for (const item of raw) {
    if (!isServiceKindId(item) || seen.has(item)) continue;
    seen.add(item);
    out.push(item);
  }
  return out;
}

function parseImages(raw: unknown, limit = OFFER_PHOTOS_LIMIT): string[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter((item): item is string => typeof item === 'string' && item.length > 0).slice(0, limit);
}

function parseCustomKinds(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const item of raw) {
    const name = asString(item).trim().slice(0, 32);
    const key = name.toLowerCase();
    if (!name || seen.has(key)) continue;
    seen.add(key);
    out.push(name);
  }
  return out.slice(0, CUSTOM_KINDS_LIMIT);
}

export function parseProfile(raw: unknown): ServiceProfile | null {
  if (!raw || typeof raw !== 'object') return null;
  const row = raw as Partial<ServiceProfile>;
  const displayName = asString(row.displayName).trim();
  if (!displayName) return null;
  const kinds = parseKinds(row.kinds);
  return {
    id: asString(row.id) || OWN_PROFILE_ID,
    displayName,
    bio: asString(row.bio).trim(),
    avatarUri: asString(row.avatarUri) || undefined,
    photos: parseImages(row.photos, PROFILE_PHOTOS_LIMIT),
    email: asString(row.email).trim(),
    phone: asString(row.phone).trim(),
    kinds,
    customKinds: parseCustomKinds(row.customKinds),
    address: asString(row.address).trim() || undefined,
    hours: parseHours(row.hours),
    updatedAt: asString(row.updatedAt) || new Date().toISOString(),
  };
}

export function parseOffer(raw: unknown): ServiceOffer | null {
  if (!raw || typeof raw !== 'object') return null;
  const row = raw as Partial<ServiceOffer>;
  const title = asString(row.title).trim();
  if (!title || !isServiceKindId(row.kind)) return null;
  return {
    id: asString(row.id) || makeOfferId(),
    profileId: asString(row.profileId) || OWN_PROFILE_ID,
    title,
    description: asString(row.description).trim(),
    price: asString(row.price).trim() || undefined,
    currency: asString(row.currency).trim() || 'RUB',
    images: parseImages(row.images, OFFER_PHOTOS_LIMIT),
    address: asString(row.address).trim() || undefined,
    phone: asString(row.phone).trim() || undefined,
    kind: row.kind,
    customKind: asString(row.customKind).trim().slice(0, 32) || undefined,
    featured: Boolean(row.featured),
    updatedAt: asString(row.updatedAt) || new Date().toISOString(),
  };
}

export function parseFreelance(raw: unknown): Pick<FreelanceState, 'profile' | 'offers'> {
  if (!raw || typeof raw !== 'object') return { profile: null, offers: [] };
  const row = raw as { profile?: unknown; offers?: unknown };
  const profile = parseProfile(row.profile);
  const offers = Array.isArray(row.offers)
    ? row.offers.map(parseOffer).filter((item): item is ServiceOffer => Boolean(item)).slice(0, OFFERS_LIMIT)
    : [];
  return { profile, offers };
}

export function makeOfferId(): string {
  return `offer:${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

export function emptyProfile(): ServiceProfile {
  return {
    id: OWN_PROFILE_ID,
    displayName: '',
    bio: '',
    email: '',
    phone: '',
    photos: [],
    kinds: [],
    customKinds: [],
    hours: { ...DEFAULT_HOURS, days: [...DEFAULT_HOURS.days] },
    updatedAt: new Date().toISOString(),
  };
}

export const hydrateFreelance = createAsyncThunk('freelance/hydrate', async () => {
  const raw = await AsyncStorage.getItem(FREELANCE_KEY);
  if (!raw) return { profile: null, offers: [] as ServiceOffer[] };
  try {
    return parseFreelance(JSON.parse(raw));
  } catch {
    return { profile: null, offers: [] as ServiceOffer[] };
  }
});

export async function persistFreelance(profile: ServiceProfile | null, offers: ServiceOffer[]): Promise<void> {
  await AsyncStorage.setItem(FREELANCE_KEY, JSON.stringify({ profile, offers })).catch(() => undefined);
}

const freelanceSlice = createSlice({
  name: 'freelance',
  initialState,
  reducers: {
    saveProfile(state, action: PayloadAction<ServiceProfile>) {
      const next = parseProfile({ ...action.payload, id: OWN_PROFILE_ID, updatedAt: new Date().toISOString() });
      if (!next) return;
      state.profile = next;
    },
    upsertOffer(state, action: PayloadAction<ServiceOffer>) {
      const next = parseOffer({
        ...action.payload,
        profileId: OWN_PROFILE_ID,
        updatedAt: new Date().toISOString(),
      });
      if (!next) return;
      const without = state.offers.filter((item) => item.id !== next.id);
      const items = [next, ...without];
      state.offers = items.slice(0, OFFERS_LIMIT);
    },
    removeOffer(state, action: PayloadAction<string>) {
      state.offers = state.offers.filter((item) => item.id !== action.payload);
    },
    applyRemoteMedia(state, action: PayloadAction<{ avatarUri?: string; offers: Record<string, string[]> }>) {
      if (state.profile && action.payload.avatarUri) {
        state.profile.avatarUri = action.payload.avatarUri;
        state.profile.photos = [action.payload.avatarUri];
      }
      for (const offer of state.offers) {
        const images = action.payload.offers[offer.id];
        if (images) offer.images = images;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(hydrateFreelance.fulfilled, (state, action) => {
        state.profile = action.payload.profile;
        state.offers = action.payload.offers;
        state.ready = true;
      })
      .addCase(hydrateFreelance.rejected, (state) => {
        state.ready = true;
      });
  },
});

export const { saveProfile, upsertOffer, removeOffer, applyRemoteMedia } = freelanceSlice.actions;
export default freelanceSlice.reducer;

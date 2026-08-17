import AsyncStorage from '@react-native-async-storage/async-storage';
import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit';

import { isServiceKindId } from '@/lib/services/kinds';
import type { ServiceHours, ServiceKindId, ServiceOffer, ServiceProfile } from '@/lib/services/types';

export const FREELANCE_KEY = 'workly:freelance:v1';
export const OWN_PROFILE_ID = 'local:me';
export const OFFERS_LIMIT = 20;
export const OFFER_PHOTOS_LIMIT = 5;

export type FreelanceState = {
  profile: ServiceProfile | null;
  offers: ServiceOffer[];
  ready: boolean;
};

const DEFAULT_HOURS: ServiceHours = { open: '09:00', close: '18:00' };

const initialState: FreelanceState = {
  profile: null,
  offers: [],
  ready: false,
};

function asString(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

function parseHours(raw: unknown): ServiceHours {
  if (!raw || typeof raw !== 'object') return DEFAULT_HOURS;
  const row = raw as Partial<ServiceHours>;
  return {
    open: asString(row.open) || DEFAULT_HOURS.open,
    close: asString(row.close) || DEFAULT_HOURS.close,
  };
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

function parseImages(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter((item): item is string => typeof item === 'string' && item.length > 0).slice(0, OFFER_PHOTOS_LIMIT);
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
    email: asString(row.email).trim(),
    phone: asString(row.phone).trim(),
    kinds,
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
    images: parseImages(row.images),
    address: asString(row.address).trim() || undefined,
    phone: asString(row.phone).trim() || undefined,
    kind: row.kind,
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
    kinds: [],
    hours: { ...DEFAULT_HOURS },
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

export const { saveProfile, upsertOffer, removeOffer } = freelanceSlice.actions;
export default freelanceSlice.reducer;

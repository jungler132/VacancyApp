import AsyncStorage from '@react-native-async-storage/async-storage';
import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit';

import { isRemoteUri } from '@/lib/backend/merge';
import { readPersisted } from '@/lib/persist';
import { isServiceKindId } from '@/lib/services/kinds';
import type { ServiceKindId, ServiceMaster, ServiceOffer, ServiceProfile } from '@/lib/services/types';

export const SAVED_SERVICES_KEY = 'vakano:saved-services:v1';
export const MAX_SAVED_SERVICES = 80;

export type SavedServiceKind = 'offer' | 'master';

export type SavedServiceItem = {
  kind: SavedServiceKind;
  id: string;
  profileId: string;
  title: string;
  masterName: string;
  price?: string;
  currency?: string;
  image?: string;
  offerKind?: ServiceKindId;
  customKind?: string;
};

export type SavedServicesState = {
  items: SavedServiceItem[];
  ready: boolean;
};

const initialState: SavedServicesState = {
  items: [],
  ready: false,
};

export function serviceSaveKey(item: Pick<SavedServiceItem, 'kind' | 'id' | 'profileId'>) {
  return item.kind === 'master' ? `master:${item.id}` : `offer:${item.profileId}:${item.id}`;
}

export function savedServiceImage(uri?: string): string | undefined {
  if (!uri || uri.length > 500 || !isRemoteUri(uri)) return undefined;
  return uri;
}

function clip(value: string, max: number) {
  return value.trim().slice(0, max);
}

export function toSavedOffer(
  offer: ServiceOffer,
  master: Pick<ServiceProfile, 'id' | 'displayName'>,
): SavedServiceItem {
  return {
    kind: 'offer',
    id: offer.id,
    profileId: master.id,
    title: clip(offer.title, 120),
    masterName: clip(master.displayName, 80),
    price: offer.price,
    currency: offer.currency,
    image: savedServiceImage(offer.images[0]),
    offerKind: offer.kind,
    customKind: offer.customKind ? clip(offer.customKind, 32) : undefined,
  };
}

export function toSavedMaster(master: ServiceMaster): SavedServiceItem {
  return {
    kind: 'master',
    id: master.id,
    profileId: master.id,
    title: clip(master.displayName, 80),
    masterName: clip(master.displayName, 80),
    image: savedServiceImage(master.avatarUri),
    offerKind: master.kinds[0],
  };
}

export function isSavedServiceItem(value: unknown): value is SavedServiceItem {
  if (!value || typeof value !== 'object') return false;
  const row = value as Partial<SavedServiceItem>;
  return (
    (row.kind === 'offer' || row.kind === 'master') &&
    typeof row.id === 'string' &&
    Boolean(row.id) &&
    typeof row.profileId === 'string' &&
    Boolean(row.profileId) &&
    typeof row.title === 'string' &&
    Boolean(row.title.trim()) &&
    typeof row.masterName === 'string'
  );
}

export function parseSavedServices(raw: unknown): SavedServiceItem[] {
  if (!Array.isArray(raw)) return [];
  const seen = new Set<string>();
  const items: SavedServiceItem[] = [];
  for (const value of raw) {
    if (!isSavedServiceItem(value)) continue;
    const item: SavedServiceItem = {
      kind: value.kind,
      id: value.id,
      profileId: value.profileId,
      title: clip(value.title, 120),
      masterName: clip(value.masterName, 80) || clip(value.title, 80),
      price: typeof value.price === 'string' ? value.price.slice(0, 40) : undefined,
      currency: typeof value.currency === 'string' ? value.currency.slice(0, 8) : undefined,
      image: savedServiceImage(value.image),
      offerKind: isServiceKindId(value.offerKind) ? value.offerKind : undefined,
      customKind: typeof value.customKind === 'string' ? clip(value.customKind, 32) : undefined,
    };
    const key = serviceSaveKey(item);
    if (seen.has(key)) continue;
    seen.add(key);
    items.push(item);
    if (items.length >= MAX_SAVED_SERVICES) break;
  }
  return items;
}

export const hydrateSavedServices = createAsyncThunk('savedServices/hydrate', async () => {
  const raw = await readPersisted(SAVED_SERVICES_KEY);
  if (!raw) return [] as SavedServiceItem[];
  try {
    return parseSavedServices(JSON.parse(raw));
  } catch {
    return [];
  }
});

export async function persistSavedServices(items: SavedServiceItem[]) {
  await AsyncStorage.setItem(SAVED_SERVICES_KEY, JSON.stringify(items)).catch(() => undefined);
}

const savedServicesSlice = createSlice({
  name: 'savedServices',
  initialState,
  reducers: {
    toggleSavedService(state, action: PayloadAction<SavedServiceItem>) {
      const next = action.payload;
      if (!next.id || !next.title.trim()) return;
      const key = serviceSaveKey(next);
      const exists = state.items.some((item) => serviceSaveKey(item) === key);
      state.items = exists
        ? state.items.filter((item) => serviceSaveKey(item) !== key)
        : [next, ...state.items].slice(0, MAX_SAVED_SERVICES);
    },
    replaceSavedServices(state, action: PayloadAction<SavedServiceItem[]>) {
      state.items = parseSavedServices(action.payload);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(hydrateSavedServices.fulfilled, (state, action) => {
        state.items = action.payload;
        state.ready = true;
      })
      .addCase(hydrateSavedServices.rejected, (state) => {
        state.ready = true;
      });
  },
});

export const { toggleSavedService, replaceSavedServices } = savedServicesSlice.actions;
export default savedServicesSlice.reducer;

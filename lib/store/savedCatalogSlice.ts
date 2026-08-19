import AsyncStorage from '@react-native-async-storage/async-storage';
import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit';

import { JOB_SITES, TELEGRAM_GROUPS, type CatalogLink } from '@/lib/telegramGroups';

export const SAVED_CATALOG_KEY = 'workly:saved-catalog:v1';

export type SavedCatalogKind = 'telegram' | 'site';

export type SavedCatalogItem = CatalogLink & { kind: SavedCatalogKind };

export type SavedCatalogState = {
  items: SavedCatalogItem[];
  ready: boolean;
};

const initialState: SavedCatalogState = {
  items: [],
  ready: false,
};

export function catalogSaveKey(kind: SavedCatalogKind, id: string) {
  return `${kind}:${id}`;
}

export function toSavedCatalogItem(item: CatalogLink, telegram: boolean): SavedCatalogItem {
  return { ...item, kind: telegram ? 'telegram' : 'site' };
}

export function resolveCatalogItem(item: SavedCatalogItem): SavedCatalogItem {
  const list = item.kind === 'telegram' ? TELEGRAM_GROUPS : JOB_SITES;
  const fresh = list.find((row) => row.id === item.id);
  return fresh ? { ...fresh, kind: item.kind } : item;
}

export function isSavedCatalogItem(value: unknown): value is SavedCatalogItem {
  if (!value || typeof value !== 'object') return false;
  const row = value as Partial<SavedCatalogItem>;
  return (
    (row.kind === 'telegram' || row.kind === 'site') &&
    typeof row.id === 'string' &&
    typeof row.title === 'string' &&
    typeof row.url === 'string' &&
    typeof row.country === 'string'
  );
}

export function parseSavedCatalog(raw: unknown): SavedCatalogItem[] {
  if (!Array.isArray(raw)) return [];
  const seen = new Set<string>();
  const items: SavedCatalogItem[] = [];
  for (const value of raw) {
    if (!isSavedCatalogItem(value)) continue;
    const key = catalogSaveKey(value.kind, value.id);
    if (seen.has(key)) continue;
    seen.add(key);
    items.push(resolveCatalogItem(value));
  }
  return items;
}

export const hydrateSavedCatalog = createAsyncThunk('savedCatalog/hydrate', async () => {
  const raw = await AsyncStorage.getItem(SAVED_CATALOG_KEY);
  if (!raw) return [] as SavedCatalogItem[];
  try {
    return parseSavedCatalog(JSON.parse(raw));
  } catch {
    return [];
  }
});

export async function persistSavedCatalog(items: SavedCatalogItem[]) {
  await AsyncStorage.setItem(SAVED_CATALOG_KEY, JSON.stringify(items)).catch(() => undefined);
}

const savedCatalogSlice = createSlice({
  name: 'savedCatalog',
  initialState,
  reducers: {
    toggleSavedCatalog(state, action: PayloadAction<SavedCatalogItem>) {
      const next = action.payload;
      const exists = state.items.some((item) => item.kind === next.kind && item.id === next.id);
      state.items = exists
        ? state.items.filter((item) => item.kind !== next.kind || item.id !== next.id)
        : [next, ...state.items];
    },
    replaceSavedCatalog(state, action: PayloadAction<SavedCatalogItem[]>) {
      state.items = parseSavedCatalog(action.payload);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(hydrateSavedCatalog.fulfilled, (state, action) => {
        state.items = action.payload;
        state.ready = true;
      })
      .addCase(hydrateSavedCatalog.rejected, (state) => {
        state.ready = true;
      });
  },
});

export const { toggleSavedCatalog, replaceSavedCatalog } = savedCatalogSlice.actions;
export default savedCatalogSlice.reducer;

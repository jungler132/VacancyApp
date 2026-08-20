import AsyncStorage from '@react-native-async-storage/async-storage';
import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit';

import { toggleCategory } from '@/lib/catalog';
import { DEFAULT_EXTRA_FILTERS, parseExtraFilters, type AgeFilter, type ExtraFilters } from '@/lib/filters';
import { placeFitsRegion } from '@/lib/places';
import type { TierFilter } from '@/lib/tiers';
import type { CategoryId, RegionId } from '@/lib/types';
import type { SearchSnapshot } from '@/lib/alerts';

export const FILTERS_KEY = 'workly:filters:v2';

const REGIONS: RegionId[] = ['all', 'cis', 'az', 'europe', 'west', 'asia', 'remote'];
const CATEGORIES: CategoryId[] = [
  'all',
  'sales',
  'medicine',
  'logistics',
  'construction',
  'education',
  'hospitality',
  'manufacturing',
  'finance',
  'admin',
  'it',
  'marketing',
  'legal',
  'agriculture',
  'security',
  'beauty',
  'hr',
  'home',
];
export type FiltersState = {
  query: string;
  region: RegionId;
  categories: CategoryId[];
  extra: ExtraFilters;
  tierFilter: TierFilter;
  sheetOpen: boolean;
  ready: boolean;
};

export type PersistedFilters = {
  query: string;
  region: RegionId;
  categories: CategoryId[];
  extra: ExtraFilters;
};

const initialState: FiltersState = {
  query: '',
  region: 'all',
  categories: ['all'],
  extra: DEFAULT_EXTRA_FILTERS,
  tierFilter: 'all',
  sheetOpen: false,
  ready: false,
};

function asRegion(value: unknown): RegionId {
  return typeof value === 'string' && (REGIONS as string[]).includes(value) ? (value as RegionId) : 'all';
}

function asCategories(value: unknown): CategoryId[] {
  if (!Array.isArray(value)) return ['all'];
  const next = value.filter((id): id is CategoryId => typeof id === 'string' && (CATEGORIES as string[]).includes(id) && id !== 'all');
  return next[0] ? [next[0]] : ['all'];
}

function asExtra(value: unknown): ExtraFilters {
  return parseExtraFilters(value);
}

export function parsePersistedFilters(raw: unknown): PersistedFilters {
  const row = raw && typeof raw === 'object' ? (raw as Partial<PersistedFilters>) : {};
  return {
    query: typeof row.query === 'string' ? row.query : '',
    region: asRegion(row.region),
    categories: asCategories(row.categories),
    extra: asExtra(row.extra),
  };
}

export const hydrateFilters = createAsyncThunk('filters/hydrate', async (): Promise<PersistedFilters> => {
  const raw = await AsyncStorage.getItem(FILTERS_KEY);
  if (!raw) return parsePersistedFilters(null);
  try {
    return parsePersistedFilters(JSON.parse(raw));
  } catch {
    return parsePersistedFilters(null);
  }
});

export async function persistFilters(state: PersistedFilters): Promise<void> {
  await AsyncStorage.setItem(
    FILTERS_KEY,
    JSON.stringify({
      query: state.query,
      region: state.region,
      categories: state.categories,
      extra: state.extra,
    }),
  ).catch(() => undefined);
}

const filtersSlice = createSlice({
  name: 'filters',
  initialState,
  reducers: {
    setQuery(state, action: PayloadAction<string>) {
      state.query = action.payload;
    },
    setRegion(state, action: PayloadAction<RegionId>) {
      state.region = action.payload;
      if (state.extra.placeId && !placeFitsRegion(state.extra.placeId, action.payload)) {
        state.extra.placeId = '';
      }
    },
    setExtra(state, action: PayloadAction<ExtraFilters>) {
      state.extra = action.payload;
    },
    setMaxAgeDays(state, action: PayloadAction<AgeFilter>) {
      if (state.extra.maxAgeDays === action.payload) return;
      state.extra.maxAgeDays = action.payload;
    },
    setTierFilter(state, action: PayloadAction<TierFilter>) {
      if (state.tierFilter === action.payload) return;
      state.tierFilter = action.payload;
    },
    toggleFilterCategory(state, action: PayloadAction<CategoryId>) {
      state.categories = toggleCategory(state.categories, action.payload);
    },
    openFilters(state) {
      state.sheetOpen = true;
    },
    closeFilters(state) {
      state.sheetOpen = false;
    },
    resetFilters(state) {
      state.categories = ['all'];
      state.extra = DEFAULT_EXTRA_FILTERS;
      state.region = 'all';
    },
    applySearch(state, action: PayloadAction<SearchSnapshot>) {
      state.query = action.payload.query;
      state.region = action.payload.region;
      state.categories = action.payload.categories.length ? action.payload.categories : ['all'];
      state.extra = parseExtraFilters(action.payload.extra);
      state.sheetOpen = false;
    },
    replaceFilters(state, action: PayloadAction<PersistedFilters>) {
      const next = parsePersistedFilters(action.payload);
      state.query = next.query;
      state.region = next.region;
      state.categories = next.categories;
      state.extra = next.extra;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(hydrateFilters.fulfilled, (state, action) => {
        state.query = action.payload.query;
        state.region = action.payload.region;
        state.categories = action.payload.categories;
        state.extra = action.payload.extra;
        state.ready = true;
      })
      .addCase(hydrateFilters.rejected, (state) => {
        state.ready = true;
      });
  },
});

export const {
  setQuery,
  setRegion,
  setExtra,
  setMaxAgeDays,
  setTierFilter,
  toggleFilterCategory,
  openFilters,
  closeFilters,
  resetFilters,
  applySearch,
  replaceFilters,
} = filtersSlice.actions;

export default filtersSlice.reducer;

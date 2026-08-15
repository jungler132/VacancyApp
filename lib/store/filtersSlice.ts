import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

import { toggleCategory } from '@/lib/catalog';
import { DEFAULT_EXTRA_FILTERS, type AgeFilter, type ExtraFilters } from '@/lib/filters';
import type { CategoryId, RegionId } from '@/lib/types';

export type FiltersState = {
  query: string;
  region: RegionId;
  categories: CategoryId[];
  extra: ExtraFilters;
  sheetOpen: boolean;
};

const initialState: FiltersState = {
  query: '',
  region: 'cis',
  categories: ['all'],
  extra: DEFAULT_EXTRA_FILTERS,
  sheetOpen: false,
};

const filtersSlice = createSlice({
  name: 'filters',
  initialState,
  reducers: {
    setQuery(state, action: PayloadAction<string>) {
      state.query = action.payload;
    },
    setRegion(state, action: PayloadAction<RegionId>) {
      state.region = action.payload;
    },
    setExtra(state, action: PayloadAction<ExtraFilters>) {
      state.extra = action.payload;
    },
    setMaxAgeDays(state, action: PayloadAction<AgeFilter>) {
      if (state.extra.maxAgeDays === action.payload) return;
      state.extra.maxAgeDays = action.payload;
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
      state.region = 'cis';
    },
  },
});

export const {
  setQuery,
  setRegion,
  setExtra,
  setMaxAgeDays,
  toggleFilterCategory,
  openFilters,
  closeFilters,
  resetFilters,
} = filtersSlice.actions;

export default filtersSlice.reducer;

import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit';

import {
  MAX_ALERTS,
  loadAlerts,
  makeAlertKey,
  type SavedSearch,
  type SearchSnapshot,
} from '@/lib/alerts';

export type AlertsState = {
  items: SavedSearch[];
  ready: boolean;
};

const initialState: AlertsState = {
  items: [],
  ready: false,
};

export const hydrateAlerts = createAsyncThunk('alerts/hydrate', () => loadAlerts());

const alertsSlice = createSlice({
  name: 'alerts',
  initialState,
  reducers: {
    saveSearch(state, action: PayloadAction<SearchSnapshot & { lastSeenIds?: string[] }>) {
      const snapshot = action.payload;
      const key = makeAlertKey(snapshot);
      const existing = state.items.find((item) => makeAlertKey(item) === key);
      if (existing) {
        existing.enabled = true;
        existing.extra = snapshot.extra;
        existing.query = snapshot.query;
        existing.region = snapshot.region;
        existing.categories = snapshot.categories;
        if (action.payload.lastSeenIds) existing.lastSeenIds = action.payload.lastSeenIds;
        return;
      }
      const next: SavedSearch = {
        id: `a${Date.now().toString(36)}`,
        query: snapshot.query,
        region: snapshot.region,
        categories: snapshot.categories,
        extra: snapshot.extra,
        enabled: true,
        lastSeenIds: action.payload.lastSeenIds ?? [],
        lastCheckedAt: Date.now(),
        lastNotifiedAt: 0,
        createdAt: Date.now(),
      };
      state.items = [next, ...state.items].slice(0, MAX_ALERTS);
    },
    removeSearch(state, action: PayloadAction<string>) {
      state.items = state.items.filter((item) => item.id !== action.payload);
    },
    toggleSearch(state, action: PayloadAction<string>) {
      const item = state.items.find((row) => row.id === action.payload);
      if (item) item.enabled = !item.enabled;
    },
    rememberSeen(state, action: PayloadAction<{ id: string; ids: string[]; notified?: boolean }>) {
      const item = state.items.find((row) => row.id === action.payload.id);
      if (!item) return;
      item.lastSeenIds = action.payload.ids.slice(0, 250);
      item.lastCheckedAt = Date.now();
      if (action.payload.notified) item.lastNotifiedAt = Date.now();
    },
    replaceAlerts(state, action: PayloadAction<SavedSearch[]>) {
      state.items = action.payload;
      state.ready = true;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(hydrateAlerts.fulfilled, (state, action) => {
        state.items = action.payload;
        state.ready = true;
      })
      .addCase(hydrateAlerts.rejected, (state) => {
        state.ready = true;
      });
  },
});

export const { saveSearch, removeSearch, toggleSearch, rememberSeen, replaceAlerts } = alertsSlice.actions;
export default alertsSlice.reducer;

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit';

import { DEFAULT_SEEK_PREFS, parseSeekPrefs, type SeekPrefs } from '@/lib/prefs';

export const IDENTITY_KEY = 'workly:identity:v1';

export type IdentityState = SeekPrefs & {
  seeking: boolean;
  available: boolean;
  ready: boolean;
};

export type IdentityPersist = SeekPrefs & {
  seeking: boolean;
  available: boolean;
};

const initialState: IdentityState = {
  ...DEFAULT_SEEK_PREFS,
  seeking: true,
  available: false,
  ready: false,
};

export function parseIdentity(raw: unknown): IdentityPersist {
  const prefs = parseSeekPrefs(raw);
  if (!raw || typeof raw !== 'object') return { ...prefs, seeking: true, available: false };
  const row = raw as { seeking?: unknown; available?: unknown };
  return {
    ...prefs,
    seeking: row.seeking !== false,
    available: row.available === true,
  };
}

export async function persistIdentity(state: IdentityPersist) {
  await AsyncStorage.setItem(IDENTITY_KEY, JSON.stringify(state)).catch(() => undefined);
}

export const hydrateIdentity = createAsyncThunk('identity/hydrate', async () => {
  const raw = await AsyncStorage.getItem(IDENTITY_KEY);
  if (!raw) return parseIdentity(null);
  try {
    return parseIdentity(JSON.parse(raw));
  } catch {
    return parseIdentity(null);
  }
});

const identitySlice = createSlice({
  name: 'identity',
  initialState,
  reducers: {
    toggleSeeking(state) {
      state.seeking = !state.seeking;
    },
    toggleAvailable(state) {
      state.available = !state.available;
    },
    toggleFormat(state, action: PayloadAction<'remote' | 'office'>) {
      state.format = state.format === action.payload ? 'any' : action.payload;
    },
    savePrefs(state, action: PayloadAction<SeekPrefs & { seeking: boolean; available: boolean }>) {
      const next = parseSeekPrefs(action.payload);
      state.title = next.title;
      state.format = next.format;
      state.seeking = action.payload.seeking;
      state.available = action.payload.available;
    },
    resetIdentity(state) {
      state.title = DEFAULT_SEEK_PREFS.title;
      state.format = DEFAULT_SEEK_PREFS.format;
      state.seeking = true;
      state.available = false;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(hydrateIdentity.fulfilled, (state, action) => {
        state.seeking = action.payload.seeking;
        state.available = action.payload.available;
        state.title = action.payload.title;
        state.format = action.payload.format;
        state.ready = true;
      })
      .addCase(hydrateIdentity.rejected, (state) => {
        state.ready = true;
      });
  },
});

export const { toggleSeeking, toggleAvailable, toggleFormat, savePrefs, resetIdentity } = identitySlice.actions;
export default identitySlice.reducer;

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit';

import type { Job } from '@/lib/types';

const STORAGE_KEY = 'workly:saved-jobs';

export type SavedState = {
  items: Job[];
  ready: boolean;
};

const initialState: SavedState = {
  items: [],
  ready: false,
};

export const hydrateSaved = createAsyncThunk('saved/hydrate', async () => {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (!raw) return [] as Job[];
  try {
    return JSON.parse(raw) as Job[];
  } catch {
    return [];
  }
});

async function persist(items: Job[]) {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(items)).catch(() => undefined);
}

const savedSlice = createSlice({
  name: 'saved',
  initialState,
  reducers: {
    toggleSaved: {
      reducer(state, action: PayloadAction<Job>) {
        const exists = state.items.some((item) => item.id === action.payload.id);
        state.items = exists
          ? state.items.filter((item) => item.id !== action.payload.id)
          : [action.payload, ...state.items];
      },
      prepare(job: Job) {
        return { payload: job };
      },
    },
  },
  extraReducers: (builder) => {
    builder.addCase(hydrateSaved.fulfilled, (state, action) => {
      state.items = action.payload;
      state.ready = true;
    });
    builder.addCase(hydrateSaved.rejected, (state) => {
      state.ready = true;
    });
  },
});

export const { toggleSaved } = savedSlice.actions;
export default savedSlice.reducer;

export function persistSaved(items: Job[]) {
  return persist(items);
}

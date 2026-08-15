import AsyncStorage from '@react-native-async-storage/async-storage';
import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit';

import type { ApplyStatus } from '@/lib/apply';
import type { Job } from '@/lib/types';

const STORAGE_KEY = 'workly:saved-jobs';

export type SavedState = {
  items: Job[];
  statuses: Record<string, ApplyStatus>;
  ready: boolean;
};

type SavedPersist = {
  items: Job[];
  statuses: Record<string, ApplyStatus>;
};

const initialState: SavedState = {
  items: [],
  statuses: {},
  ready: false,
};

function parseSaved(raw: string): SavedPersist {
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (Array.isArray(parsed)) return { items: parsed as Job[], statuses: {} };
    if (parsed && typeof parsed === 'object' && Array.isArray((parsed as SavedPersist).items)) {
      const row = parsed as SavedPersist;
      return { items: row.items, statuses: row.statuses && typeof row.statuses === 'object' ? row.statuses : {} };
    }
  } catch {
    /* ignore */
  }
  return { items: [], statuses: {} };
}

export const hydrateSaved = createAsyncThunk('saved/hydrate', async () => {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (!raw) return { items: [] as Job[], statuses: {} as Record<string, ApplyStatus> };
  return parseSaved(raw);
});

async function persist(state: Pick<SavedState, 'items' | 'statuses'>) {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ items: state.items, statuses: state.statuses })).catch(
    () => undefined,
  );
}

const savedSlice = createSlice({
  name: 'saved',
  initialState,
  reducers: {
    toggleSaved: {
      reducer(state, action: PayloadAction<Job>) {
        const exists = state.items.some((item) => item.id === action.payload.id);
        if (exists) {
          state.items = state.items.filter((item) => item.id !== action.payload.id);
          delete state.statuses[action.payload.id];
          return;
        }
        state.items = [action.payload, ...state.items];
      },
      prepare(job: Job) {
        return { payload: job };
      },
    },
    setApplyStatus(state, action: PayloadAction<{ job: Job; status: ApplyStatus | null }>) {
      const { job, status } = action.payload;
      const exists = state.items.some((item) => item.id === job.id);
      if (!exists && status) state.items = [job, ...state.items];
      if (!status) {
        delete state.statuses[job.id];
        return;
      }
      state.statuses[job.id] = status;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(hydrateSaved.fulfilled, (state, action) => {
      state.items = action.payload.items;
      state.statuses = action.payload.statuses;
      state.ready = true;
    });
    builder.addCase(hydrateSaved.rejected, (state) => {
      state.ready = true;
    });
  },
});

export const { toggleSaved, setApplyStatus } = savedSlice.actions;
export default savedSlice.reducer;

export function persistSaved(items: Job[], statuses: Record<string, ApplyStatus> = {}) {
  return persist({ items, statuses });
}

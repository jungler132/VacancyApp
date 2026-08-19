import AsyncStorage from '@react-native-async-storage/async-storage';
import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit';

import { isApplyStatus, type ApplyStatus } from '@/lib/apply';
import { MAX_PIPELINE } from '@/lib/limits';
import type { Job } from '@/lib/types';

const STORAGE_KEY = 'workly:saved-jobs';

export type SavedState = {
  items: Job[];
  statuses: Record<string, ApplyStatus>;
  statusAt: Record<string, string>;
  ready: boolean;
};

export type SavedPersist = {
  items: Job[];
  statuses: Record<string, ApplyStatus>;
  statusAt: Record<string, string>;
};

const initialState: SavedState = {
  items: [],
  statuses: {},
  statusAt: {},
  ready: false,
};

function parseStatuses(raw: unknown): Record<string, ApplyStatus> {
  if (!raw || typeof raw !== 'object') return {};
  const out: Record<string, ApplyStatus> = {};
  for (const [id, status] of Object.entries(raw as Record<string, unknown>)) {
    if (id && isApplyStatus(status)) out[id] = status;
  }
  return out;
}

function parseStatusAt(raw: unknown): Record<string, string> {
  if (!raw || typeof raw !== 'object') return {};
  const out: Record<string, string> = {};
  for (const [id, value] of Object.entries(raw as Record<string, unknown>)) {
    if (id && typeof value === 'string' && value) out[id] = value;
  }
  return out;
}

function parseSaved(raw: string): SavedPersist {
  try {
    return parseSavedPersist(JSON.parse(raw));
  } catch {
    return { items: [], statuses: {}, statusAt: {} };
  }
}

export function parseSavedPersist(raw: unknown): SavedPersist {
  if (Array.isArray(raw)) return { items: raw as Job[], statuses: {}, statusAt: {} };
  if (raw && typeof raw === 'object' && Array.isArray((raw as SavedPersist).items)) {
    const row = raw as SavedPersist;
    return {
      items: row.items,
      statuses: parseStatuses(row.statuses),
      statusAt: parseStatusAt(row.statusAt),
    };
  }
  return { items: [], statuses: {}, statusAt: {} };
}

export const hydrateSaved = createAsyncThunk('saved/hydrate', async () => {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (!raw) return { items: [] as Job[], statuses: {} as Record<string, ApplyStatus>, statusAt: {} as Record<string, string> };
  return parseSaved(raw);
});

async function persist(state: Pick<SavedState, 'items' | 'statuses' | 'statusAt'>) {
  await AsyncStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({ items: state.items, statuses: state.statuses, statusAt: state.statusAt }),
  ).catch(() => undefined);
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
          delete state.statusAt[action.payload.id];
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
      const tracked = Boolean(state.statuses[job.id]);
      if (!status) {
        delete state.statuses[job.id];
        delete state.statusAt[job.id];
        return;
      }
      if (!tracked && Object.keys(state.statuses).length >= MAX_PIPELINE) return;
      if (!exists) state.items = [job, ...state.items];
      state.statuses[job.id] = status;
      state.statusAt[job.id] = new Date().toISOString();
    },
    replaceSaved(state, action: PayloadAction<SavedPersist>) {
      const next = parseSavedPersist(action.payload);
      state.items = next.items;
      state.statuses = next.statuses;
      state.statusAt = next.statusAt;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(hydrateSaved.fulfilled, (state, action) => {
      state.items = action.payload.items;
      state.statuses = action.payload.statuses;
      state.statusAt = action.payload.statusAt;
      state.ready = true;
    });
    builder.addCase(hydrateSaved.rejected, (state) => {
      state.ready = true;
    });
  },
});

export const { toggleSaved, setApplyStatus, replaceSaved } = savedSlice.actions;
export default savedSlice.reducer;

export function persistSaved(
  items: Job[],
  statuses: Record<string, ApplyStatus> = {},
  statusAt: Record<string, string> = {},
) {
  return persist({ items, statuses, statusAt });
}

export function parseSavedJobs(raw: string): SavedPersist {
  return parseSaved(raw);
}

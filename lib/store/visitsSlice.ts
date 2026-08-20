import AsyncStorage from '@react-native-async-storage/async-storage';
import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit';

import { readPersisted } from '@/lib/persist';

export const VISITS_KEY = 'vakano:site-visits:v1';
export const VISITS_LIMIT = 24;

export type SiteVisit = {
  id: string;
  title: string;
  url: string;
  kind: 'site' | 'telegram';
  count: number;
  lastAt: number;
};

export type VisitsState = {
  items: SiteVisit[];
  ready: boolean;
};

const initialState: VisitsState = { items: [], ready: false };

function asVisit(value: unknown): SiteVisit | null {
  if (!value || typeof value !== 'object') return null;
  const row = value as Partial<SiteVisit>;
  if ((row.kind !== 'site' && row.kind !== 'telegram') || typeof row.id !== 'string') return null;
  if (typeof row.title !== 'string' || typeof row.url !== 'string') return null;
  const count = typeof row.count === 'number' && row.count > 0 ? Math.floor(row.count) : 1;
  const lastAt = typeof row.lastAt === 'number' ? row.lastAt : Date.now();
  return { id: row.id, title: row.title, url: row.url, kind: row.kind, count, lastAt };
}

export function parseVisits(raw: unknown): SiteVisit[] {
  if (!Array.isArray(raw)) return [];
  const seen = new Set<string>();
  const out: SiteVisit[] = [];
  for (const item of raw) {
    const visit = asVisit(item);
    if (!visit || seen.has(visit.id)) continue;
    seen.add(visit.id);
    out.push(visit);
  }
  return rankVisits(out).slice(0, VISITS_LIMIT);
}

export function rankVisits(items: SiteVisit[]): SiteVisit[] {
  return [...items].sort((a, b) => b.count - a.count || b.lastAt - a.lastAt);
}

export const hydrateVisits = createAsyncThunk('visits/hydrate', async () => {
  const raw = await readPersisted(VISITS_KEY);
  if (!raw) return [] as SiteVisit[];
  try {
    return parseVisits(JSON.parse(raw));
  } catch {
    return [];
  }
});

export async function persistVisits(items: SiteVisit[]) {
  await AsyncStorage.setItem(VISITS_KEY, JSON.stringify(items)).catch(() => undefined);
}

const visitsSlice = createSlice({
  name: 'visits',
  initialState,
  reducers: {
    recordVisit(state, action: PayloadAction<Omit<SiteVisit, 'count' | 'lastAt'>>) {
      const now = Date.now();
      const hit = state.items.find((item) => item.id === action.payload.id);
      if (hit) {
        hit.count += 1;
        hit.lastAt = now;
        hit.title = action.payload.title;
        hit.url = action.payload.url;
        hit.kind = action.payload.kind;
      } else {
        state.items.push({ ...action.payload, count: 1, lastAt: now });
      }
      state.items = rankVisits(state.items).slice(0, VISITS_LIMIT);
    },
    removeVisit(state, action: PayloadAction<string>) {
      state.items = state.items.filter((item) => item.id !== action.payload);
    },
    clearVisits(state) {
      state.items = [];
    },
    replaceVisits(state, action: PayloadAction<SiteVisit[]>) {
      state.items = parseVisits(action.payload);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(hydrateVisits.fulfilled, (state, action) => {
        state.items = action.payload;
        state.ready = true;
      })
      .addCase(hydrateVisits.rejected, (state) => {
        state.ready = true;
      });
  },
});

export const { recordVisit, removeVisit, clearVisits, replaceVisits } = visitsSlice.actions;
export default visitsSlice.reducer;

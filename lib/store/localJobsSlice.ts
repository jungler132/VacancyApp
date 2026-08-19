import AsyncStorage from '@react-native-async-storage/async-storage';
import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit';

import { composeSalary } from '@/lib/format';
import { LOCAL_JOBS_LIMIT, WORKLY_SOURCE_ID } from '@/lib/tiers';
import type { Job, JobTier } from '@/lib/types';

export const LOCAL_JOBS_KEY = 'workly:local-jobs';

export type LocalJobsState = {
  items: Job[];
  ready: boolean;
};

const initialState: LocalJobsState = {
  items: [],
  ready: false,
};

function isLocalJobRecord(value: unknown): value is Job {
  if (!value || typeof value !== 'object') return false;
  const row = value as Partial<Job>;
  return (
    typeof row.id === 'string' &&
    row.id.startsWith('workly:') &&
    typeof row.title === 'string' &&
    typeof row.company === 'string'
  );
}

export function parseLocalJobs(raw: unknown): Job[] {
  if (!Array.isArray(raw)) return [];
  const items = raw.filter(isLocalJobRecord).slice(0, LOCAL_JOBS_LIMIT);
  return items.map((job) => ({
    ...job,
    sourceId: WORKLY_SOURCE_ID,
    sourceName: job.sourceName || 'Workly',
    location: job.location ?? '',
    remote: Boolean(job.remote),
    url: job.url ?? '',
    excerpt: job.excerpt ?? '',
    tier: job.tier === 1 ? 1 : 2,
  }));
}

export function makeLocalJobId(): string {
  return `workly:${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

export const hydrateLocalJobs = createAsyncThunk('localJobs/hydrate', async (): Promise<Job[]> => {
  const raw = await AsyncStorage.getItem(LOCAL_JOBS_KEY);
  if (!raw) return [];
  try {
    return parseLocalJobs(JSON.parse(raw));
  } catch {
    return [];
  }
});

export async function persistLocalJobs(items: Job[]): Promise<void> {
  await AsyncStorage.setItem(LOCAL_JOBS_KEY, JSON.stringify(items)).catch(() => undefined);
}

const localJobsSlice = createSlice({
  name: 'localJobs',
  initialState,
  reducers: {
    upsertLocalJob(state, action: PayloadAction<Job>) {
      const next = action.payload;
      const without = state.items.filter((item) => item.id !== next.id);
      const items = [next, ...without];
      if (items.length > LOCAL_JOBS_LIMIT) {
        items.sort((a, b) => Date.parse(b.publishedAt ?? '') - Date.parse(a.publishedAt ?? ''));
        state.items = items.slice(0, LOCAL_JOBS_LIMIT);
        return;
      }
      state.items = items;
    },
    removeLocalJob(state, action: PayloadAction<string>) {
      state.items = state.items.filter((item) => item.id !== action.payload);
    },
    replaceLocalJobs(state, action: PayloadAction<Job[]>) {
      state.items = parseLocalJobs(action.payload);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(hydrateLocalJobs.fulfilled, (state, action) => {
        state.items = action.payload;
        state.ready = true;
      })
      .addCase(hydrateLocalJobs.rejected, (state) => {
        state.ready = true;
      });
  },
});

export const { upsertLocalJob, removeLocalJob, replaceLocalJobs } = localJobsSlice.actions;
export default localJobsSlice.reducer;

export function buildLocalJob(input: {
  title: string;
  company: string;
  location: string;
  salary?: string;
  currency?: string;
  description: string;
  category?: string;
  contact?: string;
  remote?: boolean;
  tier: JobTier;
}): Job {
  const title = input.title.trim();
  const excerpt = input.description.trim().slice(0, 180);
  return {
    id: makeLocalJobId(),
    sourceId: WORKLY_SOURCE_ID,
    sourceName: 'Workly',
    title,
    company: input.company.trim(),
    location: input.location.trim(),
    remote: Boolean(input.remote),
    salary: composeSalary(input.salary, input.currency),
    category: input.category,
    publishedAt: new Date().toISOString(),
    url: '',
    excerpt,
    description: input.description.trim(),
    contact: input.contact?.trim() || undefined,
    tier: input.tier === 1 ? 1 : 2,
  };
}

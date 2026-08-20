import AsyncStorage from '@react-native-async-storage/async-storage';
import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit';

import { composeSalary } from '@/lib/format';
import { asPlaceId } from '@/lib/places';
import { readPersisted } from '@/lib/persist';
import { APP_SOURCE_ID, LOCAL_JOBS_LIMIT, isAppJobId } from '@/lib/tiers';
import type { Job, JobTier } from '@/lib/types';

export const LOCAL_JOBS_KEY = 'vakano:local-jobs';

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
    isAppJobId(row.id) &&
    typeof row.title === 'string' &&
    typeof row.company === 'string'
  );
}

export function parseLocalJobs(raw: unknown): Job[] {
  if (!Array.isArray(raw)) return [];
  const items = raw.filter(isLocalJobRecord).slice(0, LOCAL_JOBS_LIMIT);
  return items.map((job) => ({
    ...job,
    sourceId: APP_SOURCE_ID,
    sourceName: job.sourceName || 'Vakano',
    location: job.location ?? '',
    cityId: asPlaceId((job as Job).cityId),
    remote: Boolean(job.remote),
    url: job.url ?? '',
    excerpt: job.excerpt ?? '',
    tier: job.tier === 1 ? 1 : 2,
    archived: Boolean(job.archived),
  }));
}

export function makeLocalJobId(): string {
  return `vakano:${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

export const hydrateLocalJobs = createAsyncThunk('localJobs/hydrate', async (): Promise<Job[]> => {
  const raw = await readPersisted(LOCAL_JOBS_KEY);
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
    stampCompanyOnJobs(state, action: PayloadAction<{ name?: string; logoUri?: string }>) {
      const name = action.payload.name?.trim();
      const logoUri = action.payload.logoUri?.trim();
      if (!name && !logoUri) return;
      state.items = state.items.map((job) => ({
        ...job,
        company: name || job.company,
        companyLogo: logoUri || job.companyLogo,
      }));
    },
    setLocalJobArchived(state, action: PayloadAction<{ id: string; archived: boolean }>) {
      const job = state.items.find((item) => item.id === action.payload.id);
      if (!job || job.archived === action.payload.archived) return;
      job.archived = action.payload.archived;
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

export const { upsertLocalJob, removeLocalJob, replaceLocalJobs, stampCompanyOnJobs, setLocalJobArchived } =
  localJobsSlice.actions;
export default localJobsSlice.reducer;

export function buildLocalJob(input: {
  title: string;
  company: string;
  companyLogo?: string;
  location: string;
  cityId?: string;
  salary?: string;
  currency?: string;
  description: string;
  category?: string;
  contact?: string;
  remote?: boolean;
  employment?: string;
  experience?: string;
  schedule?: string;
  tier: JobTier;
}): Job {
  const title = input.title.trim();
  const excerpt = input.description.trim().slice(0, 180);
  return {
    id: makeLocalJobId(),
    sourceId: APP_SOURCE_ID,
    sourceName: 'Vakano',
    title,
    company: input.company.trim(),
    companyLogo: input.companyLogo?.trim() || undefined,
    location: input.location.trim(),
    cityId: asPlaceId(input.cityId),
    remote: Boolean(input.remote),
    salary: composeSalary(input.salary, input.currency),
    employment: input.employment?.trim() || undefined,
    experience: input.experience?.trim() || undefined,
    schedule: input.schedule?.trim() || undefined,
    category: input.category,
    publishedAt: new Date().toISOString(),
    url: '',
    excerpt,
    description: input.description.trim(),
    contact: input.contact?.trim() || undefined,
    tier: input.tier === 1 ? 1 : 2,
    archived: false,
  };
}

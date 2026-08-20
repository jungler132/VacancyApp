import AsyncStorage from '@react-native-async-storage/async-storage';
import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit';

import { readPersisted } from '@/lib/persist';

export const COMPANY_KEY = 'vakano:company:v1';

export type CompanyPersist = {
  name: string;
  about: string;
  logoUri?: string;
};

export type CompanyState = CompanyPersist & {
  ready: boolean;
};

const initialState: CompanyState = {
  name: '',
  about: '',
  ready: false,
};

function asString(value: unknown, max: number) {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

export function parseCompany(raw: unknown): CompanyPersist {
  if (!raw || typeof raw !== 'object') return { name: '', about: '' };
  const row = raw as Partial<CompanyPersist>;
  const logoUri = typeof row.logoUri === 'string' && row.logoUri.trim() ? row.logoUri.trim() : undefined;
  return {
    name: asString(row.name, 80),
    about: asString(row.about, 500),
    logoUri,
  };
}

export async function persistCompany(state: CompanyPersist) {
  await AsyncStorage.setItem(COMPANY_KEY, JSON.stringify(state)).catch(() => undefined);
}

export const hydrateCompany = createAsyncThunk('company/hydrate', async () => {
  const raw = await readPersisted(COMPANY_KEY);
  if (!raw) return parseCompany(null);
  try {
    return parseCompany(JSON.parse(raw));
  } catch {
    return parseCompany(null);
  }
});

const companySlice = createSlice({
  name: 'company',
  initialState,
  reducers: {
    saveCompany(state, action: PayloadAction<CompanyPersist>) {
      const next = parseCompany(action.payload);
      state.name = next.name;
      state.about = next.about;
      state.logoUri = next.logoUri;
    },
    replaceCompany(state, action: PayloadAction<CompanyPersist>) {
      const next = parseCompany(action.payload);
      state.name = next.name;
      state.about = next.about;
      state.logoUri = next.logoUri;
    },
    applyCompanyLogo(state, action: PayloadAction<string | undefined>) {
      if (action.payload) state.logoUri = action.payload;
    },
    resetCompany(state) {
      state.name = '';
      state.about = '';
      state.logoUri = undefined;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(hydrateCompany.fulfilled, (state, action) => {
        state.name = action.payload.name;
        state.about = action.payload.about;
        state.logoUri = action.payload.logoUri;
        state.ready = true;
      })
      .addCase(hydrateCompany.rejected, (state) => {
        state.ready = true;
      });
  },
});

export const { saveCompany, replaceCompany, applyCompanyLogo, resetCompany } = companySlice.actions;
export default companySlice.reducer;

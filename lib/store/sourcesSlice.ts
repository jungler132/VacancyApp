import AsyncStorage from '@react-native-async-storage/async-storage';
import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit';

const STORAGE_KEY = 'workly:disabled-sources';

export type SourcesState = {
  disabledIds: string[];
  ready: boolean;
};

const initialState: SourcesState = {
  disabledIds: [],
  ready: false,
};

export const hydrateSources = createAsyncThunk('sources/hydrate', async () => {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (!raw) return [] as string[];
  try {
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === 'string') : [];
  } catch {
    return [];
  }
});

export async function persistDisabledSources(ids: string[]) {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(ids)).catch(() => undefined);
}

const sourcesSlice = createSlice({
  name: 'sources',
  initialState,
  reducers: {
    toggleSource(state, action: PayloadAction<string>) {
      const id = action.payload;
      state.disabledIds = state.disabledIds.includes(id)
        ? state.disabledIds.filter((item) => item !== id)
        : [...state.disabledIds, id];
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(hydrateSources.fulfilled, (state, action) => {
        state.disabledIds = action.payload;
        state.ready = true;
      })
      .addCase(hydrateSources.rejected, (state) => {
        state.ready = true;
      });
  },
});

export const { toggleSource } = sourcesSlice.actions;
export default sourcesSlice.reducer;

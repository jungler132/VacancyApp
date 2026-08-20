import AsyncStorage from '@react-native-async-storage/async-storage';
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';

import { readPersisted } from '@/lib/persist';

export const ONBOARDING_KEY = 'vakano:onboarding:v2';

export type OnboardingState = {
  ready: boolean;
  dismissed: boolean;
};

const initialState: OnboardingState = {
  ready: false,
  dismissed: false,
};

async function readDismissed(): Promise<boolean> {
  try {
    const raw = await readPersisted(ONBOARDING_KEY);
    if (!raw) return false;
    const parsed = JSON.parse(raw) as { dismissed?: unknown };
    return parsed.dismissed === true;
  } catch {
    return false;
  }
}

export const hydrateOnboarding = createAsyncThunk('onboarding/hydrate', readDismissed);

export const dismissOnboarding = createAsyncThunk('onboarding/dismiss', async () => {
  await AsyncStorage.setItem(ONBOARDING_KEY, JSON.stringify({ dismissed: true })).catch(() => undefined);
  return true;
});

const onboardingSlice = createSlice({
  name: 'onboarding',
  initialState,
  reducers: {
    hideOnboarding(state) {
      state.dismissed = true;
    },
    showOnboarding(state) {
      state.dismissed = false;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(hydrateOnboarding.fulfilled, (state, action) => {
        state.dismissed = action.payload;
        state.ready = true;
      })
      .addCase(hydrateOnboarding.rejected, (state) => {
        state.ready = true;
      })
      .addCase(dismissOnboarding.fulfilled, (state) => {
        state.dismissed = true;
      });
  },
});

export const { hideOnboarding, showOnboarding } = onboardingSlice.actions;
export default onboardingSlice.reducer;

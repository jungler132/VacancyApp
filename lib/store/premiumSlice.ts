import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';

import { readPremium, writePremium } from '@/lib/premium';

export type PremiumState = {
  isPremium: boolean;
  paywallOpen: boolean;
  ready: boolean;
};

const initialState: PremiumState = {
  isPremium: false,
  paywallOpen: false,
  ready: false,
};

export const hydratePremium = createAsyncThunk('premium/hydrate', () => readPremium());

export const grantPremium = createAsyncThunk('premium/grant', async () => {
  await writePremium(true);
  return true;
});

const premiumSlice = createSlice({
  name: 'premium',
  initialState,
  reducers: {
    openPaywall(state) {
      state.paywallOpen = true;
    },
    closePaywall(state) {
      state.paywallOpen = false;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(hydratePremium.fulfilled, (state, action) => {
        state.isPremium = action.payload;
        state.ready = true;
      })
      .addCase(hydratePremium.rejected, (state) => {
        state.ready = true;
      })
      .addCase(grantPremium.fulfilled, (state) => {
        state.isPremium = true;
        state.paywallOpen = false;
      });
  },
});

export const { openPaywall, closePaywall } = premiumSlice.actions;
export default premiumSlice.reducer;

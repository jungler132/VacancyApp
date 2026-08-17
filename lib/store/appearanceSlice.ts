import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit';

import {
  DEFAULT_FONT_SIZE,
  parseFontSize,
  readFontSize,
  writeFontSize,
  type FontSizeId,
} from '@/lib/fontScale';

export type AppearanceState = {
  fontSize: FontSizeId;
  ready: boolean;
};

const initialState: AppearanceState = {
  fontSize: DEFAULT_FONT_SIZE,
  ready: false,
};

export const hydrateAppearance = createAsyncThunk('appearance/hydrate', () => readFontSize());

const appearanceSlice = createSlice({
  name: 'appearance',
  initialState,
  reducers: {
    setFontSize(state, action: PayloadAction<FontSizeId>) {
      state.fontSize = parseFontSize(action.payload);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(hydrateAppearance.fulfilled, (state, action) => {
        state.fontSize = action.payload;
        state.ready = true;
      })
      .addCase(hydrateAppearance.rejected, (state) => {
        state.ready = true;
      });
  },
});

export const { setFontSize } = appearanceSlice.actions;
export default appearanceSlice.reducer;

export async function persistFontSize(id: FontSizeId) {
  await writeFontSize(id);
}

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit';

import {
  DEFAULT_FONT_SIZE,
  FONT_SIZE_KEY,
  parseFontSize,
  type FontSizeId,
} from '@/lib/fontScale';
import { DEFAULT_LOCALE, detectLocale, parseLocale, type AppLocale } from '@/lib/i18n/locale';

export const APPEARANCE_KEY = 'workly:appearance:v2';

export type AppearanceState = {
  fontSize: FontSizeId;
  locale: AppLocale;
  ready: boolean;
};

const initialState: AppearanceState = {
  fontSize: DEFAULT_FONT_SIZE,
  locale: DEFAULT_LOCALE,
  ready: false,
};

async function readAppearance(): Promise<{ fontSize: FontSizeId; locale: AppLocale }> {
  const raw = await AsyncStorage.getItem(APPEARANCE_KEY);
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as { fontSize?: unknown; locale?: unknown };
      return {
        fontSize: parseFontSize(parsed.fontSize),
        locale: parseLocale(parsed.locale) ?? detectLocale(),
      };
    } catch {
      /* migrate below */
    }
  }
  const legacy = await AsyncStorage.getItem(FONT_SIZE_KEY);
  let fontSize = DEFAULT_FONT_SIZE;
  if (legacy) {
    try {
      fontSize = parseFontSize(JSON.parse(legacy));
    } catch {
      fontSize = parseFontSize(legacy);
    }
  }
  return { fontSize, locale: detectLocale() };
}

export async function persistAppearance(fontSize: FontSizeId, locale: AppLocale) {
  await AsyncStorage.setItem(APPEARANCE_KEY, JSON.stringify({ fontSize, locale })).catch(() => undefined);
}

export const hydrateAppearance = createAsyncThunk('appearance/hydrate', () => readAppearance());

const appearanceSlice = createSlice({
  name: 'appearance',
  initialState,
  reducers: {
    setFontSize(state, action: PayloadAction<FontSizeId>) {
      state.fontSize = parseFontSize(action.payload);
    },
    setLocale(state, action: PayloadAction<AppLocale>) {
      state.locale = parseLocale(action.payload) ?? DEFAULT_LOCALE;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(hydrateAppearance.fulfilled, (state, action) => {
        state.fontSize = action.payload.fontSize;
        state.locale = action.payload.locale;
        state.ready = true;
      })
      .addCase(hydrateAppearance.rejected, (state) => {
        state.locale = detectLocale();
        state.ready = true;
      });
  },
});

export const { setFontSize, setLocale } = appearanceSlice.actions;
export default appearanceSlice.reducer;

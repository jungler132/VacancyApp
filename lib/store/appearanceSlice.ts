import AsyncStorage from '@react-native-async-storage/async-storage';
import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit';

import {
  DEFAULT_FONT_SIZE,
  FONT_SIZE_KEY,
  parseFontSize,
  type FontSizeId,
} from '@/lib/fontScale';
import { DEFAULT_LOCALE, detectLocale, parseLocale, type AppLocale } from '@/lib/i18n/locale';
import { DEFAULT_THEME_PREF, parseThemePref, type ThemePreference } from '@/lib/theme';

export const APPEARANCE_KEY = 'workly:appearance:v2';

export type AppearanceState = {
  fontSize: FontSizeId;
  locale: AppLocale;
  theme: ThemePreference;
  ready: boolean;
};

const initialState: AppearanceState = {
  fontSize: DEFAULT_FONT_SIZE,
  locale: detectLocale(),
  theme: DEFAULT_THEME_PREF,
  ready: false,
};

async function readAppearance(): Promise<{ fontSize: FontSizeId; locale: AppLocale; theme: ThemePreference }> {
  const raw = await AsyncStorage.getItem(APPEARANCE_KEY);
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as { fontSize?: unknown; locale?: unknown; theme?: unknown };
      return {
        fontSize: parseFontSize(parsed.fontSize),
        locale: parseLocale(parsed.locale) ?? detectLocale(),
        theme: parseThemePref(parsed.theme),
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
  return { fontSize, locale: detectLocale(), theme: DEFAULT_THEME_PREF };
}

export async function persistAppearance(fontSize: FontSizeId, locale: AppLocale, theme: ThemePreference) {
  await AsyncStorage.setItem(APPEARANCE_KEY, JSON.stringify({ fontSize, locale, theme })).catch(() => undefined);
}

export async function readStoredLocale(): Promise<AppLocale> {
  try {
    const raw = await AsyncStorage.getItem(APPEARANCE_KEY);
    if (!raw) return detectLocale();
    const parsed = JSON.parse(raw) as { locale?: unknown };
    return parseLocale(parsed.locale) ?? detectLocale();
  } catch {
    return detectLocale();
  }
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
    setTheme(state, action: PayloadAction<ThemePreference>) {
      state.theme = parseThemePref(action.payload);
    },
    replaceAppearance(state, action: PayloadAction<{ fontSize: FontSizeId; locale: AppLocale; theme: ThemePreference }>) {
      state.fontSize = parseFontSize(action.payload.fontSize);
      state.locale = parseLocale(action.payload.locale) ?? DEFAULT_LOCALE;
      state.theme = parseThemePref(action.payload.theme);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(hydrateAppearance.fulfilled, (state, action) => {
        state.fontSize = action.payload.fontSize;
        state.locale = action.payload.locale;
        state.theme = action.payload.theme;
        state.ready = true;
      })
      .addCase(hydrateAppearance.rejected, (state) => {
        state.locale = detectLocale();
        state.ready = true;
      });
  },
});

export const { setFontSize, setLocale, setTheme, replaceAppearance } = appearanceSlice.actions;
export default appearanceSlice.reducer;

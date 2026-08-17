import { createContext, useContext, useMemo } from 'react';
import { StyleSheet, type ImageStyle, type TextStyle, type ViewStyle } from 'react-native';
import { MD3DarkTheme, MD3LightTheme, configureFonts } from 'react-native-paper';

export type ColorSchemeName = 'light' | 'dark';
export type ThemePreference = 'light' | 'dark' | 'system';

export const THEME_OPTIONS: ThemePreference[] = ['system', 'light', 'dark'];
export const DEFAULT_THEME_PREF: ThemePreference = 'system';

export const lightColors = {
  bg: '#f7f9fb',
  bgMid: '#f2f4f6',
  bgElevated: '#ffffff',
  card: '#ffffff',
  cardBorder: '#c5c5d3',
  text: '#191c1e',
  muted: '#444651',
  faint: '#757682',
  placeholder: '#757682',
  accent: '#00236f',
  accentGlow: 'rgba(30, 58, 138, 0.16)',
  accentDim: '#dce1ff',
  accentText: '#ffffff',
  primaryContainer: '#1e3a8a',
  onPrimaryContainer: '#90a8ff',
  salary: '#1e3a8a',
  blue: '#4059aa',
  orange: '#c47b2a',
  orangeDim: '#fff3e0',
  pink: '#b54d6a',
  danger: '#ba1a1a',
  chip: '#f2f4f6',
  chipBorder: '#c5c5d3',
  chipActive: '#1e3a8a',
  glass: '#ffffff',
};

export const darkColors: typeof lightColors = {
  bg: '#07090F',
  bgMid: '#0B1220',
  bgElevated: 'rgba(18, 26, 40, 0.92)',
  card: '#151D2C',
  cardBorder: 'rgba(255, 255, 255, 0.10)',
  text: '#F5F7FB',
  muted: '#A8B4C8',
  faint: '#7B889C',
  placeholder: '#7B889C',
  accent: '#B6C4FF',
  accentGlow: 'rgba(182, 196, 255, 0.28)',
  accentDim: 'rgba(30, 58, 138, 0.45)',
  accentText: '#00164e',
  primaryContainer: '#1e3a8a',
  onPrimaryContainer: '#dce1ff',
  salary: '#B6C4FF',
  blue: '#7BA3FF',
  orange: '#F0A05A',
  orangeDim: '#3D2E12',
  pink: '#FF7A9C',
  danger: '#FF8A80',
  chip: 'rgba(255,255,255,0.04)',
  chipBorder: 'rgba(255,255,255,0.12)',
  chipActive: '#1e3a8a',
  glass: '#0E1420',
};

export type ThemeColors = typeof lightColors;

/** Fallback for non-React modules (stats, tests). UI should use `useColors`. */
export const colors = lightColors;

export const fonts = {
  regular: 'IBMPlexMono_400Regular',
  medium: 'IBMPlexMono_500Medium',
  semibold: 'IBMPlexMono_600SemiBold',
  bold: 'IBMPlexMono_700Bold',
};

export const radius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  full: 999,
};

export function shadowsFor(scheme: ColorSchemeName) {
  if (scheme === 'dark') {
    return {
      card: {
        shadowColor: '#000',
        shadowOpacity: 0.38,
        shadowRadius: 18,
        shadowOffset: { width: 0, height: 10 },
        elevation: 8,
      },
      glow: {
        shadowColor: '#B6C4FF',
        shadowOpacity: 0.28,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 0 },
        elevation: 4,
      },
      tabBar: {
        shadowColor: '#000',
        shadowOpacity: 0.4,
        shadowRadius: 16,
        shadowOffset: { width: 0, height: -6 },
        elevation: 12,
      },
    };
  }
  return {
    card: {
      shadowColor: '#000',
      shadowOpacity: 0.05,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 4 },
      elevation: 3,
    },
    glow: {
      shadowColor: '#1e3a8a',
      shadowOpacity: 0.18,
      shadowRadius: 10,
      shadowOffset: { width: 0, height: 4 },
      elevation: 4,
    },
    tabBar: {
      shadowColor: '#1e3a8a',
      shadowOpacity: 0.08,
      shadowRadius: 24,
      shadowOffset: { width: 0, height: -8 },
      elevation: 12,
    },
  };
}

export const shadows = shadowsFor('light');

export const regionColor: Record<string, string> = {
  cis: '#4059aa',
  az: '#c47b2a',
  europe: '#7BA3FF',
  west: '#52625c',
  asia: '#b54d6a',
  remote: '#314156',
  all: '#4059aa',
  global: '#757682',
  intl: '#757682',
};

export const CHART_PALETTE = ['#4059aa', '#7BA3FF', '#c47b2a', '#b54d6a'] as const;

export function parseThemePref(raw: unknown): ThemePreference {
  return raw === 'light' || raw === 'dark' || raw === 'system' ? raw : DEFAULT_THEME_PREF;
}

export function resolveScheme(
  pref: ThemePreference,
  system: ColorSchemeName | null | undefined,
): ColorSchemeName {
  if (pref === 'light' || pref === 'dark') return pref;
  return system === 'dark' ? 'dark' : 'light';
}

export function palette(scheme: ColorSchemeName): ThemeColors {
  return scheme === 'dark' ? darkColors : lightColors;
}

type ThemeValue = { scheme: ColorSchemeName; colors: ThemeColors };

export const ThemeContext = createContext<ThemeValue>({
  scheme: 'light',
  colors: lightColors,
});

export function useAppTheme() {
  return useContext(ThemeContext);
}

export function useColors() {
  return useAppTheme().colors;
}

type NamedStyles<T> = { [P in keyof T]: ViewStyle | TextStyle | ImageStyle };

const styleCache = new WeakMap<Function, { light?: object; dark?: object }>();

export function useThemedStyles<T extends NamedStyles<T>>(factory: (colors: ThemeColors, scheme: ColorSchemeName) => T): T {
  const { scheme } = useAppTheme();
  return useMemo(() => {
    let entry = styleCache.get(factory) as { light?: T; dark?: T } | undefined;
    if (!entry) {
      entry = {};
      styleCache.set(factory, entry);
    }
    if (scheme === 'dark') {
      entry.dark ??= StyleSheet.create(factory(darkColors, 'dark'));
      return entry.dark;
    }
    entry.light ??= StyleSheet.create(factory(lightColors, 'light'));
    return entry.light;
  }, [factory, scheme]);
}

const PAPER_SIZES = {
  displaySmall: 36,
  headlineSmall: 24,
  titleLarge: 22,
  titleMedium: 16,
  titleSmall: 14,
  bodyLarge: 16,
  bodyMedium: 14,
  bodySmall: 12,
  labelLarge: 14,
  labelMedium: 12,
  labelSmall: 11,
} as const;

function paperFonts(scale: number) {
  const size = (n: number) => Math.round(n * scale * 2) / 2;
  return configureFonts({
    config: {
      displaySmall: { fontFamily: fonts.bold, fontSize: size(PAPER_SIZES.displaySmall), lineHeight: size(44) },
      headlineSmall: { fontFamily: fonts.bold, fontSize: size(PAPER_SIZES.headlineSmall), lineHeight: size(32) },
      titleLarge: { fontFamily: fonts.bold, fontSize: size(PAPER_SIZES.titleLarge), lineHeight: size(28) },
      titleMedium: { fontFamily: fonts.semibold, fontSize: size(PAPER_SIZES.titleMedium), lineHeight: size(24) },
      titleSmall: { fontFamily: fonts.semibold, fontSize: size(PAPER_SIZES.titleSmall), lineHeight: size(20) },
      bodyLarge: { fontFamily: fonts.regular, fontSize: size(PAPER_SIZES.bodyLarge), lineHeight: size(24) },
      bodyMedium: { fontFamily: fonts.regular, fontSize: size(PAPER_SIZES.bodyMedium), lineHeight: size(20) },
      bodySmall: { fontFamily: fonts.regular, fontSize: size(PAPER_SIZES.bodySmall), lineHeight: size(16) },
      labelLarge: { fontFamily: fonts.semibold, fontSize: size(PAPER_SIZES.labelLarge), lineHeight: size(20) },
      labelMedium: { fontFamily: fonts.medium, fontSize: size(PAPER_SIZES.labelMedium), lineHeight: size(16) },
      labelSmall: { fontFamily: fonts.medium, fontSize: size(PAPER_SIZES.labelSmall), lineHeight: size(16) },
    },
  });
}

export function makePaperTheme(scheme: ColorSchemeName = 'light', scale = 1) {
  const c = palette(scheme);
  const base = scheme === 'dark' ? MD3DarkTheme : MD3LightTheme;
  return {
    ...base,
    dark: scheme === 'dark',
    roundness: 8,
    fonts: paperFonts(scale),
    colors: {
      ...base.colors,
      primary: c.accent,
      onPrimary: c.accentText,
      primaryContainer: c.primaryContainer,
      onPrimaryContainer: c.onPrimaryContainer,
      secondary: scheme === 'dark' ? c.blue : '#52625c',
      background: c.bg,
      surface: c.card,
      surfaceVariant: c.bgMid,
      onSurface: c.text,
      onSurfaceVariant: c.muted,
      outline: c.faint,
      outlineVariant: c.cardBorder,
      error: c.danger,
      elevation: {
        ...base.colors.elevation,
        level0: 'transparent',
        level1: c.card,
        level2: c.bgMid,
        level3: scheme === 'dark' ? '#1E2A3D' : '#eceef0',
      },
    },
  };
}

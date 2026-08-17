import { MD3DarkTheme, configureFonts } from 'react-native-paper';

export const colors = {
  bg: '#07090F',
  bgMid: '#0B1220',
  bgElevated: 'rgba(18, 26, 40, 0.72)',
  card: '#151D2C',
  cardBorder: 'rgba(255, 255, 255, 0.07)',
  text: '#F5F7FB',
  muted: '#A8B4C8',
  faint: '#7B889C',
  placeholder: '#7B889C',
  accent: '#00D4A1',
  accentGlow: 'rgba(0, 212, 161, 0.42)',
  accentDim: 'rgba(0, 212, 161, 0.16)',
  accentText: '#05241C',
  salary: '#E8C572',
  blue: '#7BA3FF',
  orange: '#FFB020',
  orangeDim: '#3D2E12',
  pink: '#FF7A9C',
  danger: '#FF6B6B',
  chip: 'rgba(255,255,255,0.03)',
  chipBorder: 'rgba(255,255,255,0.10)',
  chipActive: '#00D4A1',
  glass: 'rgba(10, 14, 22, 0.42)',
};

export const fonts = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semibold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
};

export const radius = {
  sm: 4,
  md: 6,
  lg: 8,
  xl: 10,
};

export const shadows = {
  card: {
    shadowColor: '#000',
    shadowOpacity: 0.38,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 10,
  },
  glow: {
    shadowColor: '#00D4A1',
    shadowOpacity: 0.55,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 0 },
    elevation: 6,
  },
};

export const regionColor: Record<string, string> = {
  cis: '#00D4A1',
  az: '#F0A05A',
  europe: '#7BA3FF',
  west: '#E8C572',
  asia: '#FF7A9C',
  remote: '#A78BFA',
  all: '#00D4A1',
  global: '#8B9BB4',
  intl: '#8B9BB4',
};

export const CHART_PALETTE = [colors.accent, colors.blue, colors.salary, colors.pink] as const;

export const paperTheme = {
  ...MD3DarkTheme,
  dark: true,
  roundness: 6,
  fonts: configureFonts({
    config: {
      displaySmall: { fontFamily: fonts.bold },
      headlineSmall: { fontFamily: fonts.bold },
      titleLarge: { fontFamily: fonts.bold },
      titleMedium: { fontFamily: fonts.semibold },
      titleSmall: { fontFamily: fonts.semibold },
      bodyLarge: { fontFamily: fonts.regular },
      bodyMedium: { fontFamily: fonts.regular },
      bodySmall: { fontFamily: fonts.regular },
      labelLarge: { fontFamily: fonts.semibold },
      labelMedium: { fontFamily: fonts.medium },
      labelSmall: { fontFamily: fonts.medium },
    },
  }),
  colors: {
    ...MD3DarkTheme.colors,
    primary: colors.accent,
    onPrimary: colors.accentText,
    primaryContainer: colors.accentDim,
    onPrimaryContainer: colors.accent,
    secondary: colors.blue,
    background: colors.bg,
    surface: colors.card,
    surfaceVariant: '#1A2436',
    onSurface: colors.text,
    onSurfaceVariant: colors.muted,
    outline: colors.chipBorder,
    outlineVariant: colors.cardBorder,
    error: colors.danger,
    elevation: {
      ...MD3DarkTheme.colors.elevation,
      level0: 'transparent',
      level1: colors.card,
      level2: '#1A2436',
      level3: '#1E2A3D',
    },
  },
};


import '@/lib/alertsTask';
import { useEffect, useMemo, type ReactNode } from 'react';
import { Provider } from 'react-redux';
import { DarkTheme, Stack, ThemeProvider } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from '@expo-google-fonts/inter';
import { PaperProvider } from 'react-native-paper';

import { AlertsHost } from '@/components/AlertsHost';
import { InterstitialHost } from '@/components/InterstitialOverlay';
import { PaywallHost } from '@/components/PaywallSheet';
import { FONT_SCALE, FontScaleContext, scaleFont, useFontScale } from '@/lib/fontScale';
import { store } from '@/lib/store';
import { useAppSelector } from '@/lib/store/hooks';
import { colors, fonts, makePaperTheme } from '@/lib/theme';

SplashScreen.preventAutoHideAsync();

const navTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: colors.bg,
    card: colors.bg,
    text: colors.text,
    border: colors.cardBorder,
    primary: colors.accent,
  },
  fonts: {
    regular: { fontFamily: fonts.regular, fontWeight: 'normal' as const },
    medium: { fontFamily: fonts.medium, fontWeight: 'normal' as const },
    bold: { fontFamily: fonts.semibold, fontWeight: 'normal' as const },
    heavy: { fontFamily: fonts.bold, fontWeight: 'normal' as const },
  },
};

function AppShell({ children }: { children: ReactNode }) {
  const fontSize = useAppSelector((state) => state.appearance.fontSize);
  const scale = FONT_SCALE[fontSize];
  const theme = useMemo(() => makePaperTheme(scale), [scale]);

  return (
    <FontScaleContext.Provider value={scale}>
      <PaperProvider theme={theme}>{children}</PaperProvider>
    </FontScaleContext.Provider>
  );
}

function Navigation() {
  const scale = useFontScale();
  return (
    <ThemeProvider value={navTheme}>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.bg },
          headerTintColor: colors.text,
          headerShadowVisible: false,
          headerTitleStyle: { fontFamily: fonts.semibold, fontSize: scaleFont(18, scale) },
          contentStyle: { backgroundColor: colors.bg },
        }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="job/create" options={{ title: 'Новая вакансия' }} />
        <Stack.Screen name="job/[...id]" options={{ title: 'Вакансия' }} />
      </Stack>
    </ThemeProvider>
  );
}

export default function RootLayout() {
  const [loaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  useEffect(() => {
    if (loaded) SplashScreen.hideAsync();
  }, [loaded]);

  if (!loaded) return null;

  return (
    <Provider store={store}>
      <AppShell>
        <AlertsHost />
        <InterstitialHost />
        <PaywallHost />
        <Navigation />
      </AppShell>
    </Provider>
  );
}

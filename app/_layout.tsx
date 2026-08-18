import '@/lib/alertsTask';
import { useEffect, useMemo, type ReactNode } from 'react';
import { Provider } from 'react-redux';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import {
  IBMPlexMono_400Regular,
  IBMPlexMono_500Medium,
  IBMPlexMono_600SemiBold,
  IBMPlexMono_700Bold,
  useFonts,
} from '@expo-google-fonts/ibm-plex-mono';
import { PaperProvider } from 'react-native-paper';

import { AlertsHost } from '@/components/AlertsHost';
import { InterstitialHost } from '@/components/InterstitialOverlay';
import { PaywallHost } from '@/components/PaywallSheet';
import { FONT_SCALE, FontScaleContext, scaleFont, useFontScale } from '@/lib/fontScale';
import { store } from '@/lib/store';
import { useAppSelector } from '@/lib/store/hooks';
import { fonts, makePaperTheme, useAppTheme } from '@/lib/theme';
import { ThemeBridge } from '@/lib/themeContext';
import { t } from '@/lib/i18n';

SplashScreen.preventAutoHideAsync();

function AppShell({ children }: { children: ReactNode }) {
  const fontSize = useAppSelector((state) => state.appearance.fontSize);
  const { scheme } = useAppTheme();
  const scale = FONT_SCALE[fontSize];
  const theme = useMemo(() => makePaperTheme(scheme, scale), [scheme, scale]);

  return (
    <FontScaleContext.Provider value={scale}>
      <PaperProvider theme={theme}>{children}</PaperProvider>
    </FontScaleContext.Provider>
  );
}

function Navigation() {
  const scale = useFontScale();
  const locale = useAppSelector((state) => state.appearance.locale);
  const { scheme, colors } = useAppTheme();
  const navTheme = useMemo(() => {
    const base = scheme === 'dark' ? DarkTheme : DefaultTheme;
    return {
      ...base,
      colors: {
        ...base.colors,
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
  }, [scheme, colors]);

  return (
    <ThemeProvider value={navTheme}>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.bg },
          headerTintColor: colors.text,
          headerShadowVisible: false,
          headerTitleStyle: { fontFamily: fonts.semibold, fontSize: scaleFont(18, scale) },
          contentStyle: { backgroundColor: colors.bg },
        }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="job/create" options={{ title: t(locale, 'nav.createJob') }} />
        <Stack.Screen name="job/[...id]" options={{ title: t(locale, 'nav.job') }} />
        <Stack.Screen name="service/me" options={{ title: t(locale, 'nav.serviceMe') }} />
        <Stack.Screen name="service/[id]" options={{ title: t(locale, 'nav.master') }} />
        <Stack.Screen name="service/offer/[id]" options={{ title: t(locale, 'nav.offer') }} />
        <Stack.Screen name="stats" options={{ title: t(locale, 'nav.stats') }} />
        <Stack.Screen name="saved" options={{ title: t(locale, 'nav.saved') }} />
        <Stack.Screen name="pipeline/index" options={{ title: t(locale, 'nav.pipeline') }} />
        <Stack.Screen name="pipeline/add" options={{ title: t(locale, 'nav.pipelineAdd') }} />
        <Stack.Screen name="prefs" options={{ title: t(locale, 'nav.prefs') }} />
        <Stack.Screen name="today" options={{ title: t(locale, 'nav.today') }} />
        <Stack.Screen name="privacy" options={{ title: t(locale, 'nav.privacy') }} />
      </Stack>
    </ThemeProvider>
  );
}

export default function RootLayout() {
  const [loaded, error] = useFonts({
    IBMPlexMono_400Regular,
    IBMPlexMono_500Medium,
    IBMPlexMono_600SemiBold,
    IBMPlexMono_700Bold,
  });

  useEffect(() => {
    if (loaded || error) SplashScreen.hideAsync();
  }, [loaded, error]);

  useEffect(() => {
    const timer = setTimeout(() => SplashScreen.hideAsync(), 1500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <Provider store={store}>
      <ThemeBridge>
        <AppShell>
          <AlertsHost />
          <InterstitialHost />
          <PaywallHost />
          <Navigation />
        </AppShell>
      </ThemeBridge>
    </Provider>
  );
}

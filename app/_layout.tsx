import '@/lib/alertsTask';
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { View } from 'react-native';
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

import { RouteErrorBoundary } from '@/components/RouteErrorBoundary';
import { AlertsHost } from '@/components/AlertsHost';
import { AppNoticeHost } from '@/components/AppNoticeHost';
import { BackendHost } from '@/components/BackendHost';
import { AdsHost } from '@/components/AdsHost';
import { BillingHost } from '@/components/BillingHost';
import { FilterSheetHost } from '@/components/FilterSheetHost';
import { PaywallHost } from '@/components/PaywallSheet';
import { OnboardingHost } from '@/components/OnboardingHost';
import { SyncOverlayHost } from '@/components/SyncOverlay';
import { afterFirstPaint } from '@/lib/afterPaint';
import { FONT_SCALE, FontScaleContext, scaleFont, useFontScale } from '@/lib/fontScale';
import { onShellReady } from '@/lib/shellReady';
import { store } from '@/lib/store';
import { useAppSelector } from '@/lib/store/hooks';
import { fonts, makePaperTheme, useAppTheme } from '@/lib/theme';
import { ThemeBridge } from '@/lib/themeContext';
import { t } from '@/lib/i18n';

SplashScreen.preventAutoHideAsync().catch(() => undefined);

export { RouteErrorBoundary as ErrorBoundary };

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
          headerBackButtonDisplayMode: 'minimal',
          headerBackTitle: '',
          headerTitleStyle: { fontFamily: fonts.semibold, fontSize: scaleFont(18, scale) },
          contentStyle: { backgroundColor: colors.bg },
        }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false, title: '' }} />
        <Stack.Screen name="job/create" options={{ title: t(locale, 'nav.createJob') }} />
        <Stack.Screen name="job/[...id]" options={{ title: t(locale, 'nav.job') }} />
        <Stack.Screen name="service/me" options={{ title: t(locale, 'nav.serviceMe') }} />
        <Stack.Screen name="company/me" options={{ title: t(locale, 'nav.companyMe') }} />
        <Stack.Screen name="service/[id]" options={{ title: t(locale, 'nav.master') }} />
        <Stack.Screen name="service/view/[id]" options={{ title: t(locale, 'nav.offer') }} />
        <Stack.Screen name="service/offer/[id]" options={{ title: t(locale, 'nav.offer') }} />
        <Stack.Screen name="stats" options={{ title: t(locale, 'nav.stats') }} />
        <Stack.Screen name="saved" options={{ title: t(locale, 'nav.saved') }} />
        <Stack.Screen name="pipeline/index" options={{ title: t(locale, 'nav.pipeline') }} />
        <Stack.Screen name="pipeline/add" options={{ title: t(locale, 'nav.pipelineAdd') }} />
        <Stack.Screen name="prefs" options={{ title: t(locale, 'nav.prefs') }} />
        <Stack.Screen name="today" options={{ title: t(locale, 'nav.today') }} />
        <Stack.Screen name="privacy" options={{ title: t(locale, 'nav.privacy') }} />
        <Stack.Screen name="auth/callback" options={{ title: t(locale, 'nav.settings') }} />
      </Stack>
    </ThemeProvider>
  );
}

function AfterPaintHosts() {
  const [ready, setReady] = useState(false);
  useEffect(() => afterFirstPaint(() => setReady(true)), []);
  if (!ready) return null;
  return (
    <>
      <AlertsHost />
      <BackendHost />
      <AdsHost />
      <PaywallHost />
      <FilterSheetHost />
      <SyncOverlayHost />
      <AppNoticeHost />
    </>
  );
}

function AppBody({ onPainted }: { onPainted: () => void }) {
  const appearanceReady = useAppSelector((state) => state.appearance.ready);
  const onboardReady = useAppSelector((state) => state.onboarding.ready);
  const dismissed = useAppSelector((state) => state.onboarding.dismissed);
  const sawTour = useRef(false);
  if (!dismissed) sawTour.current = true;
  const [shellReady, setShellReady] = useState(false);

  const bootReady = appearanceReady && onboardReady;
  useEffect(() => {
    if (bootReady) onPainted();
  }, [bootReady, onPainted]);

  useEffect(() => onShellReady(() => setShellReady(true)), []);

  useEffect(() => {
    if (!sawTour.current || !dismissed || shellReady) return undefined;
    const timer = setTimeout(() => setShellReady(true), 8000);
    return () => clearTimeout(timer);
  }, [dismissed, shellReady]);

  if (!bootReady) return null;

  const held = sawTour.current && dismissed && !shellReady;
  const showTour = !dismissed || held;
  const showApp = dismissed;

  return (
    <View style={{ flex: 1, backgroundColor: SPLASH_BG }} onLayout={onPainted}>
      {showApp ? (
        <>
          <Navigation />
          {shellReady ? <AfterPaintHosts /> : null}
        </>
      ) : null}
      {showTour ? <OnboardingHost overlay={showApp} held={held} /> : null}
    </View>
  );
}

const SPLASH_BG = '#00236f';

export default function RootLayout() {
  useFonts({
    IBMPlexMono_400Regular,
    IBMPlexMono_500Medium,
    IBMPlexMono_600SemiBold,
    IBMPlexMono_700Bold,
  });
  const [painted, setPainted] = useState(false);
  const onPainted = useCallback(() => setPainted(true), []);

  useEffect(() => {
    if (!painted) return;
    SplashScreen.hideAsync().catch(() => undefined);
  }, [painted]);

  useEffect(() => {
    const timer = setTimeout(() => SplashScreen.hideAsync().catch(() => undefined), 8000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <Provider store={store}>
      <ThemeBridge>
        <AppShell>
          <BillingHost>
            <AppBody onPainted={onPainted} />
          </BillingHost>
        </AppShell>
      </ThemeBridge>
    </Provider>
  );
}

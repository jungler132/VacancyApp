import { useEffect } from 'react';
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

import { store } from '@/lib/store';
import { colors, fonts } from '@/lib/theme';

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
      <ThemeProvider value={navTheme}>
        <StatusBar style="light" />
        <Stack
          screenOptions={{
            headerStyle: { backgroundColor: colors.bg },
            headerTintColor: colors.text,
            headerShadowVisible: false,
            headerTitleStyle: { fontFamily: fonts.semibold, fontSize: 18 },
            contentStyle: { backgroundColor: colors.bg },
          }}>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="job/[id]" options={{ title: 'Вакансия' }} />
        </Stack>
      </ThemeProvider>
    </Provider>
  );
}

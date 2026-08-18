import { Link, Stack } from 'expo-router';
import { View } from 'react-native';

import { fonts, useThemedStyles, type ColorSchemeName, type ThemeColors } from '@/lib/theme';
import { Text } from '@/components/AppText';
import { useT } from '@/lib/i18n/useT';

export default function NotFoundScreen() {
  const t = useT();
  const styles = useThemedStyles(notFoundStyles);
  return (
    <>
      <Stack.Screen options={{ title: t('nav.notFound') }} />
      <View style={styles.container}>
        <Text style={styles.title}>{t('notFound.body')}</Text>
        <Link href="/" style={styles.link}>
          <Text style={styles.linkText}>{t('notFound.back')}</Text>
        </Link>
      </View>
    </>
  );
}

function notFoundStyles(colors: ThemeColors, _scheme: ColorSchemeName) {
  return {
    container: { flex: 1, backgroundColor: colors.bg, alignItems: 'center' as const, justifyContent: 'center' as const, padding: 20 },
    title: { fontSize: 18, fontFamily: fonts.bold, color: colors.text },
    link: { marginTop: 16 },
    linkText: { color: colors.accent, fontFamily: fonts.bold },
  };
}

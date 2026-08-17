import { Link, Stack } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { colors } from '@/lib/theme';
import { Text } from '@/components/AppText';
import { useT } from '@/lib/i18n/useT';

export default function NotFoundScreen() {
  const t = useT();
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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center', padding: 20 },
  title: { fontSize: 18, fontWeight: '700', color: colors.text },
  link: { marginTop: 16 },
  linkText: { color: colors.accent, fontWeight: '700' },
});

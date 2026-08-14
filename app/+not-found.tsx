import { Link, Stack } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { colors } from '@/lib/theme';

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Нет такой страницы' }} />
      <View style={styles.container}>
        <Text style={styles.title}>Экран не найден</Text>
        <Link href="/" style={styles.link}>
          <Text style={styles.linkText}>К вакансиям</Text>
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

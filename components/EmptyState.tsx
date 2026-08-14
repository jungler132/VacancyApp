import { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors, fonts } from '@/lib/theme';

export const EmptyState = memo(function EmptyState({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <View style={styles.box}>
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.sub}>{subtitle}</Text> : null}
    </View>
  );
});

const styles = StyleSheet.create({
  box: { paddingVertical: 48, alignItems: 'center', gap: 8, paddingHorizontal: 24 },
  title: { color: colors.text, fontSize: 16, fontFamily: fonts.bold, textAlign: 'center' },
  sub: { color: colors.muted, textAlign: 'center', lineHeight: 20, fontFamily: fonts.regular },
});

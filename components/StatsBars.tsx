import { memo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';

import { tokenLabel } from '@/lib/i18n';
import { useLocale, useT } from '@/lib/i18n/useT';
import type { StatSlice } from '@/lib/stats';
import { colors, radius } from '@/lib/theme';

const STAT_PREFIXES = ['stats.age', 'fact', 'category', 'kind'];

export const StatsBars = memo(function StatsBars({
  title,
  total,
  slices,
}: {
  title: string;
  total: number;
  slices: StatSlice[];
}) {
  const t = useT();
  const locale = useLocale();
  const max = Math.max(total, 1);

  return (
    <View style={styles.card}>
      <Text variant="titleMedium">{title}</Text>
      <View style={styles.list}>
        {slices.length ? (
          slices.map((slice) => (
            <View key={slice.id} style={styles.row}>
              <View style={styles.meta}>
                <Text variant="bodySmall" numberOfLines={1} style={styles.label}>
                  {tokenLabel(locale, slice.id, STAT_PREFIXES)}
                </Text>
                <Text variant="labelSmall">{slice.value}</Text>
              </View>
              <View style={styles.track}>
                <View
                  style={[
                    styles.fill,
                    { width: `${Math.max((slice.value / max) * 100, 4)}%`, backgroundColor: slice.color },
                  ]}
                />
              </View>
            </View>
          ))
        ) : (
          <Text variant="bodySmall">{t('stats.empty')}</Text>
        )}
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: 14,
    marginBottom: 12,
  },
  list: { gap: 10, marginTop: 12 },
  row: { gap: 6 },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  label: { flex: 1, color: colors.muted },
  track: {
    height: 8,
    borderRadius: radius.md,
    backgroundColor: colors.chip,
    overflow: 'hidden',
  },
  fill: { height: 8, borderRadius: radius.md },
});

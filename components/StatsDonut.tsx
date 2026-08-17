import { memo } from 'react';
import { View } from 'react-native';
import { Text } from 'react-native-paper';
import { PieChart } from 'react-native-gifted-charts';

import { tokenLabel } from '@/lib/i18n';
import { useLocale, useT } from '@/lib/i18n/useT';
import type { StatSlice } from '@/lib/stats';
import { radius, useColors, useThemedStyles, type ColorSchemeName, type ThemeColors } from '@/lib/theme';

const STAT_PREFIXES = ['stats.age', 'fact', 'category', 'kind'];

export const StatsDonut = memo(function StatsDonut({
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
  const colors = useColors();
  const styles = useThemedStyles(statsDonutStyles);
  const data = slices.map((slice) => ({
    value: slice.value,
    color: slice.color,
    text: slice.value > 0 ? `${Math.round((slice.value / Math.max(total, 1)) * 100)}%` : '',
  }));

  return (
    <View style={styles.card}>
      <Text variant="titleMedium">{title}</Text>
      <View style={styles.chartRow}>
        {data.length ? (
          <PieChart
            data={data}
            donut
            radius={96}
            innerRadius={58}
            innerCircleColor={colors.card}
            isAnimated={false}
            centerLabelComponent={() => (
              <Text variant="titleMedium" style={styles.center}>
                {total}
              </Text>
            )}
          />
        ) : (
          <View style={styles.emptyChart}>
            <Text variant="bodySmall">{t('stats.empty')}</Text>
          </View>
        )}
        <View style={styles.legend}>
          {slices.map((slice) => (
            <View key={slice.id} style={styles.legendRow}>
              <View style={[styles.dot, { backgroundColor: slice.color }]} />
              <Text variant="bodySmall" numberOfLines={1} style={styles.legendLabel}>
                {tokenLabel(locale, slice.id, STAT_PREFIXES)}
              </Text>
              <Text variant="labelSmall">{slice.value}</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
});

function statsDonutStyles(colors: ThemeColors, _scheme: ColorSchemeName) {
  return {
    card: {
      backgroundColor: colors.card,
      borderRadius: radius.lg,
      padding: 14,
      marginBottom: 12,
    },
    chartRow: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 12, marginTop: 8 },
    center: { textAlign: 'center' as const },
    emptyChart: { width: 192, height: 192, alignItems: 'center' as const, justifyContent: 'center' as const },
    legend: { flex: 1, gap: 6 },
    legendRow: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 8 },
    dot: { width: 8, height: 8, borderRadius: 2 },
    legendLabel: { flex: 1, color: colors.muted },
  };
}

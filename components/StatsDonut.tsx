import { memo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { PieChart } from 'react-native-gifted-charts';

import type { StatSlice } from '@/lib/stats';
import { colors } from '@/lib/theme';

export const StatsDonut = memo(function StatsDonut({
  title,
  total,
  slices,
}: {
  title: string;
  total: number;
  slices: StatSlice[];
}) {
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
            radius={78}
            innerRadius={48}
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
            <Text variant="bodySmall">Нет данных</Text>
          </View>
        )}
        <View style={styles.legend}>
          {slices.map((slice) => (
            <View key={slice.id} style={styles.legendRow}>
              <View style={[styles.dot, { backgroundColor: slice.color }]} />
              <Text variant="bodySmall" numberOfLines={1} style={styles.legendLabel}>
                {slice.label}
              </Text>
              <Text variant="labelSmall">{slice.value}</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: 8,
    padding: 14,
    marginBottom: 12,
  },
  chartRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 8 },
  center: { textAlign: 'center' },
  emptyChart: { width: 156, height: 156, alignItems: 'center', justifyContent: 'center' },
  legend: { flex: 1, gap: 6 },
  legendRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dot: { width: 8, height: 8, borderRadius: 2 },
  legendLabel: { flex: 1, color: colors.muted },
});

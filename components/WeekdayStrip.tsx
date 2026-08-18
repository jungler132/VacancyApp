import { memo, useCallback } from 'react';
import { Pressable, View } from 'react-native';

import { Text } from '@/components/AppText';
import { keyOf } from '@/lib/i18n';
import { useT } from '@/lib/i18n/useT';
import { WEEKDAYS } from '@/lib/services/hours';
import type { WeekdayId } from '@/lib/services/types';
import { fonts, radius, useThemedStyles, type ThemeColors } from '@/lib/theme';

export const WeekdayStrip = memo(function WeekdayStrip({
  value,
  onToggle,
}: {
  value: WeekdayId[];
  onToggle: (id: WeekdayId) => void;
}) {
  const t = useT();
  const styles = useThemedStyles(weekdayStripStyles);

  return (
    <View style={styles.row}>
      {WEEKDAYS.map((id) => (
        <DayCell key={id} id={id} label={t(keyOf('week', id))} selected={value.includes(id)} onToggle={onToggle} />
      ))}
    </View>
  );
});

const DayCell = memo(function DayCell({
  id,
  label,
  selected,
  onToggle,
}: {
  id: WeekdayId;
  label: string;
  selected: boolean;
  onToggle: (id: WeekdayId) => void;
}) {
  const styles = useThemedStyles(weekdayStripStyles);
  const press = useCallback(() => onToggle(id), [id, onToggle]);
  return (
    <Pressable onPress={press} style={({ pressed }) => [styles.cell, selected && styles.cellOn, pressed && styles.pressed]}>
      <Text style={[styles.label, selected && styles.labelOn]}>{label}</Text>
    </Pressable>
  );
});

function weekdayStripStyles(colors: ThemeColors) {
  return {
    row: {
      flexDirection: 'row' as const,
      gap: 6,
      padding: 6,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.chipBorder,
      backgroundColor: colors.card,
    },
    cell: {
      flex: 1,
      minWidth: 0,
      height: 44,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      borderRadius: radius.sm,
      backgroundColor: colors.chip,
    },
    cellOn: { backgroundColor: colors.primaryContainer },
    label: { color: colors.muted, fontFamily: fonts.medium, fontSize: 12 },
    labelOn: { color: colors.onPrimaryContainer, fontFamily: fonts.semibold },
    pressed: { opacity: 0.86 },
  };
}

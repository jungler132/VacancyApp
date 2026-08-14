import { memo, type ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';

import { colors, fonts, radius } from '@/lib/theme';

type Item<T extends string | number> = { id: T; label: string; icon?: string };

const Chip = memo(function Chip({
  id,
  label,
  icon,
  active,
  compact,
  onPress,
}: {
  id: string | number;
  label: string;
  icon?: string;
  active: boolean;
  compact?: boolean;
  onPress: (id: string | number) => void;
}) {
  return (
    <Pressable
      onPress={() => onPress(id)}
      style={[styles.chip, compact && styles.chipSm, active && styles.active]}>
      {icon && !compact ? <Text style={styles.icon}>{icon}</Text> : null}
      <Text style={[styles.label, compact && styles.labelSm, active && styles.labelActive]}>{label}</Text>
    </Pressable>
  );
});

function FilterChipsInner<T extends string | number>({
  items,
  value,
  values,
  onChange,
  onToggle,
  trailing,
  compact,
}: {
  items: Item<T>[];
  value?: T;
  values?: T[];
  onChange?: (id: T) => void;
  onToggle?: (id: T) => void;
  trailing?: ReactNode;
  compact?: boolean;
}) {
  const selected = values ?? (value != null ? [value] : []);
  const press = onToggle ?? onChange;

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
      {items.map((item) => (
        <Chip
          key={item.id}
          id={item.id}
          label={item.label}
          icon={item.icon}
          compact={compact}
          active={selected.includes(item.id)}
          onPress={press as (id: string | number) => void}
        />
      ))}
      {trailing}
    </ScrollView>
  );
}

export const FilterChips = memo(FilterChipsInner) as typeof FilterChipsInner;

const styles = StyleSheet.create({
  row: { gap: 6, paddingRight: 8, alignItems: 'center' },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.chip,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.chipBorder,
  },
  chipSm: {
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  active: {
    backgroundColor: colors.accentDim,
    borderColor: colors.accent,
  },
  icon: { fontSize: 12 },
  label: { color: colors.muted, fontSize: 13, fontFamily: fonts.semibold },
  labelSm: { fontSize: 12 },
  labelActive: { color: colors.accent },
});

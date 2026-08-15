import { memo, type ComponentProps, type ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';
import MaterialDesignIcons from '@react-native-vector-icons/material-design-icons';

import { colors, radius } from '@/lib/theme';

type Item<T extends string | number> = { id: T; label: string; icon?: string };

export const SelectChip = memo(function SelectChip({
  id,
  label,
  selected,
  compact,
  icon,
  onChange,
}: {
  id: string | number;
  label: string;
  selected: boolean;
  compact?: boolean;
  icon?: string;
  onChange: (id: string | number) => void;
}) {
  const tint = selected ? colors.accent : colors.muted;

  return (
    <Pressable
      onPress={() => onChange(id)}
      style={[styles.chip, compact && styles.chipSm, selected && styles.selected]}>
      {icon ? (
        <MaterialDesignIcons
          name={icon as ComponentProps<typeof MaterialDesignIcons>['name']}
          size={compact ? 14 : 16}
          color={tint}
        />
      ) : null}
      <Text style={[styles.label, compact && styles.labelSm, selected && styles.labelOn]}>{label}</Text>
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
  const press = (onToggle ?? onChange) as ((id: string | number) => void) | undefined;

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
      {items.map((item) => (
        <SelectChip
          key={String(item.id)}
          id={item.id}
          label={item.label}
          icon={item.icon}
          compact={compact}
          selected={selected.includes(item.id)}
          onChange={press ?? noop}
        />
      ))}
      {trailing}
    </ScrollView>
  );
}

const noop = () => undefined;

export const FilterChips = memo(FilterChipsInner) as typeof FilterChipsInner;

const styles = StyleSheet.create({
  row: { gap: 6, paddingRight: 8, alignItems: 'center' },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: colors.chipBorder,
    backgroundColor: colors.chip,
    borderRadius: radius.md,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  chipSm: { paddingHorizontal: 10, paddingVertical: 5 },
  selected: { backgroundColor: colors.accentDim, borderColor: colors.accent },
  label: { color: colors.muted, fontSize: 13, fontWeight: '600' },
  labelSm: { fontSize: 12 },
  labelOn: { color: colors.accent },
});

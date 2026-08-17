import { memo, useCallback, type ComponentProps, type ReactNode } from 'react';
import { Pressable, ScrollView } from 'react-native';
import MaterialDesignIcons from '@react-native-vector-icons/material-design-icons';

import { fonts, radius, useColors, useThemedStyles, type ThemeColors } from '@/lib/theme';
import { Text } from '@/components/AppText';

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
  const colors = useColors();
  const styles = useThemedStyles(chipStyles);
  const tint = selected ? colors.onPrimaryContainer : colors.muted;
  const press = useCallback(() => onChange(id), [id, onChange]);

  return (
    <Pressable
      onPress={press}
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
  const styles = useThemedStyles(chipStyles);
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

function chipStyles(colors: ThemeColors) {
  return {
    row: { gap: 8, paddingRight: 8 },
    chip: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: 6,
      flexGrow: 0,
      flexShrink: 0,
      borderWidth: 1,
      borderColor: colors.chipBorder,
      backgroundColor: colors.chip,
      borderRadius: radius.full,
      paddingHorizontal: 14,
      paddingVertical: 8,
    },
    chipSm: { paddingHorizontal: 12, paddingVertical: 7 },
    selected: { backgroundColor: colors.primaryContainer, borderColor: colors.primaryContainer },
    label: {
      color: colors.text,
      fontSize: 12,
      lineHeight: 16,
      fontFamily: fonts.medium,
      flexShrink: 0,
      includeFontPadding: false,
    },
    labelSm: { fontSize: 12 },
    labelOn: { color: colors.onPrimaryContainer },
  };
}

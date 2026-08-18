import { memo, useCallback, type ComponentProps, type ReactNode } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
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
      style={[styles.chip, compact && styles.chipSm]}>
      <View style={[styles.bg, selected && styles.bgOn]} pointerEvents="none" />
      {icon ? (
        <MaterialDesignIcons
          name={icon as ComponentProps<typeof MaterialDesignIcons>['name']}
          size={compact ? 14 : 16}
          color={tint}
          style={styles.icon}
        />
      ) : null}
      <Text style={[styles.label, selected && styles.labelOn]}>{label}</Text>
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
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      <View style={styles.row} collapsable={false}>
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
      </View>
    </ScrollView>
  );
}

const noop = () => undefined;

export const FilterChips = memo(FilterChipsInner) as typeof FilterChipsInner;

function chipStyles(colors: ThemeColors) {
  return {
    row: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 8, paddingRight: 8 },
    chip: {
      position: 'relative' as const,
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      alignSelf: 'flex-start' as const,
      flexGrow: 0,
      flexShrink: 0,
      overflow: 'visible' as const,
      paddingHorizontal: 14,
      paddingVertical: 8,
    },
    chipSm: { paddingHorizontal: 12, paddingVertical: 8 },
    bg: {
      position: 'absolute' as const,
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
      borderRadius: radius.full,
      borderWidth: 1,
      borderColor: colors.chipBorder,
      backgroundColor: colors.chip,
    },
    bgOn: {
      backgroundColor: colors.primaryContainer,
      borderColor: colors.primaryContainer,
    },
    icon: { marginRight: 6 },
    label: {
      color: colors.text,
      fontSize: 13,
      lineHeight: 20,
      fontFamily: fonts.medium,
      flexGrow: 0,
      flexShrink: 0,
    },
    labelOn: { color: colors.onPrimaryContainer },
  };
}

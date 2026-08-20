import { memo, useCallback } from 'react';
import { Pressable, View } from 'react-native';

import { Text } from '@/components/AppText';
import { fonts, radius, useThemedStyles, type ThemeColors } from '@/lib/theme';

export const ChoiceBar = memo(function ChoiceBar({
  value,
  options,
  onChange,
}: {
  value: string;
  options: { id: string; label: string }[];
  onChange: (id: string) => void;
}) {
  const styles = useThemedStyles(choiceBarStyles);
  return (
    <View style={styles.row}>
      {options.map((item) => (
        <ChoiceCell
          key={item.id}
          id={item.id}
          label={item.label}
          selected={value === item.id}
          onChange={onChange}
        />
      ))}
    </View>
  );
});

const ChoiceCell = memo(function ChoiceCell({
  id,
  label,
  selected,
  onChange,
}: {
  id: string;
  label: string;
  selected: boolean;
  onChange: (id: string) => void;
}) {
  const styles = useThemedStyles(choiceBarStyles);
  const press = useCallback(() => onChange(id), [id, onChange]);
  return (
    <Pressable onPress={press} style={[styles.cell, selected && styles.cellOn]}>
      <Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7} style={[styles.label, selected && styles.labelOn]}>
        {label}
      </Text>
    </Pressable>
  );
});

function choiceBarStyles(colors: ThemeColors) {
  return {
    row: {
      flexDirection: 'row' as const,
      gap: 6,
    },
    cell: {
      flex: 1,
      minWidth: 0,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      paddingVertical: 8,
      paddingHorizontal: 6,
      borderWidth: 1,
      borderColor: colors.chipBorder,
      borderRadius: radius.md,
      backgroundColor: colors.chip,
    },
    cellOn: {
      backgroundColor: colors.accentDim,
      borderColor: colors.accent,
    },
    label: {
      color: colors.muted,
      fontFamily: fonts.medium,
      fontSize: 12,
      lineHeight: 16,
      textAlign: 'center' as const,
    },
    labelOn: {
      color: colors.accent,
      fontFamily: fonts.semibold,
    },
  };
}

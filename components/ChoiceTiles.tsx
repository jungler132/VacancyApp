import { memo, useCallback } from 'react';
import { Pressable, View, type TextStyle, type ViewStyle } from 'react-native';

import { Text } from '@/components/AppText';
import { fonts, radius, useThemedStyles, type ThemeColors } from '@/lib/theme';

export const ChoiceTiles = memo(function ChoiceTiles({
  items,
  selected,
  onChange,
}: {
  items: { id: string; label: string }[];
  selected: string | string[];
  onChange: (id: string) => void;
}) {
  const styles = useThemedStyles(choiceStyles);
  return (
    <View style={styles.row}>
      {items.map((item) => (
        <ChoiceTile
          key={item.id}
          id={item.id}
          label={item.label}
          on={Array.isArray(selected) ? selected.includes(item.id) : selected === item.id}
          onChange={onChange}
          tile={styles.tile}
          tileOn={styles.tileOn}
          labelStyle={styles.label}
          labelOn={styles.labelOn}
        />
      ))}
    </View>
  );
});

const ChoiceTile = memo(function ChoiceTile({
  id,
  label,
  on,
  onChange,
  tile,
  tileOn,
  labelStyle,
  labelOn,
}: {
  id: string;
  label: string;
  on: boolean;
  onChange: (id: string) => void;
  tile: ViewStyle;
  tileOn: ViewStyle;
  labelStyle: TextStyle;
  labelOn: TextStyle;
}) {
  const press = useCallback(() => onChange(id), [id, onChange]);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: on }}
      onPress={press}
      style={on ? tileOn : tile}
    >
      <Text style={on ? labelOn : labelStyle} numberOfLines={2}>
        {label}
      </Text>
    </Pressable>
  );
});

function choiceStyles(colors: ThemeColors) {
  return {
    row: { flexDirection: 'row' as const, gap: 8 },
    tile: {
      flex: 1,
      minHeight: 48,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.chipBorder,
      backgroundColor: colors.chip,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      paddingHorizontal: 8,
      paddingVertical: 10,
    },
    tileOn: {
      flex: 1,
      minHeight: 48,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.chipActive,
      backgroundColor: colors.chipActive,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      paddingHorizontal: 8,
      paddingVertical: 10,
    },
    label: {
      color: colors.text,
      fontFamily: fonts.medium,
      fontSize: 13,
      lineHeight: 18,
      textAlign: 'center' as const,
    },
    labelOn: {
      color: colors.accentText,
      fontFamily: fonts.semibold,
      fontSize: 13,
      lineHeight: 18,
      textAlign: 'center' as const,
    },
  };
}

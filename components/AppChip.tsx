import { memo } from 'react';
import { View } from 'react-native';

import { Text } from '@/components/AppText';
import { fonts, radius, useThemedStyles, type ThemeColors } from '@/lib/theme';

export const AppChip = memo(function AppChip({
  label,
  selected = false,
}: {
  label: string;
  selected?: boolean;
}) {
  const styles = useThemedStyles(appChipStyles);
  return (
    <View style={[styles.chip, selected ? styles.selected : null]}>
      <Text style={[styles.text, selected ? styles.textOn : null]}>{label}</Text>
    </View>
  );
});

function appChipStyles(colors: ThemeColors) {
  return {
    chip: {
      flexGrow: 0,
      flexShrink: 0,
      alignSelf: 'flex-start' as const,
      borderRadius: radius.full,
      borderWidth: 1,
      borderColor: colors.chipBorder,
      backgroundColor: colors.chip,
      paddingHorizontal: 12,
      paddingVertical: 7,
    },
    selected: {
      backgroundColor: colors.accentDim,
      borderColor: colors.accentDim,
    },
    text: {
      fontSize: 12,
      lineHeight: 16,
      color: colors.muted,
      fontFamily: fonts.medium,
      includeFontPadding: false,
    },
    textOn: { color: colors.accent },
  };
}

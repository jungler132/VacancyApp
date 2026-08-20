import { memo } from 'react';
import { View } from 'react-native';

import { Text } from '@/components/AppText';
import { monoAdvance, scaleFont, useFontScale } from '@/lib/fontScale';
import { fonts, radius, useThemedStyles, type ThemeColors } from '@/lib/theme';

const CHIP_FONT = 13;
const QUIET_FONT = 11;

export const AppChip = memo(function AppChip({
  label,
  selected = false,
  quiet = false,
}: {
  label: string;
  selected?: boolean;
  quiet?: boolean;
}) {
  const scale = useFontScale();
  const styles = useThemedStyles(appChipStyles);
  const fontSize = scaleFont(quiet ? QUIET_FONT : CHIP_FONT, scale);
  const textWidth = monoAdvance(label, fontSize);
  return (
    <View style={[styles.chip, quiet && styles.chipQuiet]} collapsable={false}>
      <View
        style={[styles.bg, selected && !quiet ? styles.bgOn : null, quiet ? styles.bgQuiet : null]}
        pointerEvents="none"
      />
      <Text
        style={[
          styles.text,
          selected && !quiet ? styles.textOn : null,
          quiet ? styles.textQuiet : null,
          { width: textWidth, fontSize, lineHeight: Math.ceil(fontSize * 1.3) },
        ]}>
        {label}
      </Text>
    </View>
  );
});

function appChipStyles(colors: ThemeColors) {
  return {
    chip: {
      position: 'relative' as const,
      flexGrow: 0,
      flexShrink: 0,
      flexBasis: 'auto' as const,
      alignSelf: 'flex-start' as const,
      overflow: 'visible' as const,
      paddingHorizontal: 12,
      paddingVertical: 8,
    },
    chipQuiet: {
      paddingHorizontal: 8,
      paddingVertical: 3,
    },
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
      backgroundColor: colors.accentDim,
      borderColor: colors.accentDim,
    },
    bgQuiet: {
      borderRadius: radius.md,
      backgroundColor: 'transparent',
      borderColor: colors.cardBorder,
    },
    text: {
      fontSize: CHIP_FONT,
      lineHeight: 20,
      color: colors.muted,
      fontFamily: fonts.medium,
      flexGrow: 0,
      flexShrink: 0,
    },
    textOn: { color: colors.accent },
    textQuiet: {
      color: colors.faint,
      fontFamily: fonts.medium,
    },
  };
}

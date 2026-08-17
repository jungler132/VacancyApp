import { memo } from 'react';
import { StyleSheet } from 'react-native';
import { Chip } from 'react-native-paper';

import { scaleFont, useFontScale } from '@/lib/fontScale';
import { colors, radius } from '@/lib/theme';

export const AppChip = memo(function AppChip({
  label,
  selected = false,
}: {
  label: string;
  selected?: boolean;
}) {
  const scale = useFontScale();
  return (
    <Chip
      compact
      mode="flat"
      style={[styles.chip, selected ? styles.selected : null]}
      textStyle={[styles.text, { fontSize: scaleFont(13, scale) }, selected ? styles.textOn : null]}>
      {label}
    </Chip>
  );
});

const styles = StyleSheet.create({
  chip: {
    alignSelf: 'flex-start',
    height: 32,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.chipBorder,
    backgroundColor: colors.chip,
  },
  selected: {
    backgroundColor: colors.accentDim,
    borderColor: colors.accent,
  },
  text: { fontSize: 13, color: colors.muted, fontWeight: '600' },
  textOn: { color: colors.accent },
});

import { memo } from 'react';
import { Pressable } from 'react-native';
import MaterialDesignIcons from '@react-native-vector-icons/material-design-icons';

import { Text } from '@/components/AppText';
import { useT } from '@/lib/i18n/useT';
import { fonts, radius, useColors, useThemedStyles, type ThemeColors } from '@/lib/theme';

export const CreateJobButton = memo(function CreateJobButton({
  onPress,
}: {
  onPress?: () => void;
}) {
  const t = useT();
  const colors = useColors();
  const styles = useThemedStyles(createJobButtonStyles);
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={t('jobs.createA11y')}
      style={({ pressed }) => [styles.btn, pressed && styles.pressed]}>
      <MaterialDesignIcons name="plus" size={16} color={colors.accentText} />
      <Text numberOfLines={1} style={styles.label}>
        {t('jobs.new')}
      </Text>
    </Pressable>
  );
});

function createJobButtonStyles(colors: ThemeColors) {
  return {
    btn: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: 4,
      backgroundColor: colors.accent,
      borderRadius: radius.full,
      paddingHorizontal: 10,
      paddingVertical: 7,
      maxWidth: 168,
    },
    label: { color: colors.accentText, fontFamily: fonts.bold, fontSize: 12 },
    pressed: { opacity: 0.86 },
  };
}

import { memo, useCallback, type ReactNode } from 'react';
import { Pressable, View } from 'react-native';
import MaterialDesignIcons from '@react-native-vector-icons/material-design-icons';

import { Text } from '@/components/AppText';
import { fonts, premiumGlow, premiumSurface, radius, shadowsFor, useColors, useThemedStyles, type ColorSchemeName, type ThemeColors } from '@/lib/theme';

export const NavRow = memo(function NavRow({
  title,
  meta,
  onPress,
  onClear,
  clearLabel,
  right,
  premium,
}: {
  title: string;
  meta?: string;
  onPress: () => void;
  onClear?: () => void;
  clearLabel?: string;
  right?: ReactNode;
  premium?: boolean;
}) {
  const colors = useColors();
  const styles = useThemedStyles(navRowStyles);
  const press = useCallback(() => onPress(), [onPress]);
  return (
    <Pressable onPress={press} style={({ pressed }) => [styles.row, premium && styles.premium, pressed && styles.pressed]}>
      {premium ? <View style={styles.stripe} /> : null}
      <View style={styles.body}>
        <Text style={styles.title}>{title}</Text>
        {meta ? <Text style={styles.meta}>{meta}</Text> : null}
      </View>
      {onClear ? (
        <Pressable
          onPress={(event) => {
            event.stopPropagation();
            onClear();
          }}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel={clearLabel}>
          <MaterialDesignIcons name="close" size={20} color={colors.faint} />
        </Pressable>
      ) : right !== undefined ? (
        right
      ) : (
        <Text style={styles.chevron}>›</Text>
      )}
    </Pressable>
  );
});

function navRowStyles(colors: ThemeColors, scheme: ColorSchemeName) {
  return {
    row: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.cardBorder,
      borderRadius: radius.lg,
      paddingHorizontal: 16,
      paddingVertical: 14,
      gap: 8,
      overflow: 'hidden' as const,
      ...shadowsFor(scheme).card,
    },
    premium: {
      ...premiumSurface(colors),
      ...premiumGlow(scheme),
    },
    stripe: {
      position: 'absolute' as const,
      left: 0,
      top: 0,
      bottom: 0,
      width: 4,
      backgroundColor: colors.orange,
    },
    body: { flex: 1, minWidth: 0 },
    title: { color: colors.text, fontFamily: fonts.semibold, fontSize: 15 },
    meta: { color: colors.faint, fontFamily: fonts.medium, fontSize: 12, marginTop: 2 },
    chevron: { color: colors.faint, fontSize: 22, lineHeight: 24 },
    pressed: { opacity: 0.86 },
  };
}

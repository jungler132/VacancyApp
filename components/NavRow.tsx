import { memo, useCallback, type ReactNode } from 'react';
import { Pressable, View } from 'react-native';
import MaterialDesignIcons from '@react-native-vector-icons/material-design-icons';

import { Text } from '@/components/AppText';
import { ToneCard } from '@/components/ToneCard';
import { fonts, useColors, useThemedStyles, type ColorSchemeName, type ThemeColors } from '@/lib/theme';

export const NavRow = memo(function NavRow({
  title,
  meta,
  onPress,
  onClear,
  clearLabel,
  right,
  premium,
  workly,
  muted,
}: {
  title: string;
  meta?: string;
  onPress: () => void;
  onClear?: () => void;
  clearLabel?: string;
  right?: ReactNode;
  premium?: boolean;
  workly?: boolean;
  muted?: boolean;
}) {
  const colors = useColors();
  const styles = useThemedStyles(navRowStyles);
  const press = useCallback(() => onPress(), [onPress]);
  return (
    <ToneCard
      tone={muted ? 'default' : premium ? 'premium' : workly ? 'workly' : 'default'}
      onPress={press}
      style={[styles.row, muted && styles.muted]}>
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
    </ToneCard>
  );
});

function navRowStyles(colors: ThemeColors, _scheme: ColorSchemeName) {
  return {
    row: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      paddingHorizontal: 16,
      paddingVertical: 14,
      gap: 8,
    },
    body: { flex: 1, minWidth: 0 },
    title: { color: colors.text, fontFamily: fonts.semibold, fontSize: 15 },
    meta: { color: colors.faint, fontFamily: fonts.medium, fontSize: 12, marginTop: 2 },
    chevron: { color: colors.faint, fontSize: 22, lineHeight: 24 },
    muted: { opacity: 0.62 },
  };
}

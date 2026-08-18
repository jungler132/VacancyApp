import { memo, type ReactNode } from 'react';
import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MaterialDesignIcons from '@react-native-vector-icons/material-design-icons';

import { fonts, radius, useColors, useThemedStyles, type ThemeColors } from '@/lib/theme';
import { Text } from '@/components/AppText';
import { useT } from '@/lib/i18n/useT';

export const FiltersButton = memo(function FiltersButton({
  active,
  onPress,
}: {
  active: boolean;
  onPress: () => void;
}) {
  const t = useT();
  const colors = useColors();
  const styles = useThemedStyles(headerStyles);
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.filterBtn, active && styles.filterBtnOn, pressed && styles.pressed]}
      accessibilityRole="button"
      accessibilityLabel={t('common.filters')}>
      <MaterialDesignIcons
        name="filter-variant"
        size={18}
        color={active ? colors.onPrimaryContainer : colors.accent}
      />
      <Text style={[styles.filterLabel, active && styles.filterLabelOn]}>{t('common.filters')}</Text>
    </Pressable>
  );
});

export const FilterIconButton = memo(function FilterIconButton({
  active,
  onPress,
}: {
  active: boolean;
  onPress: () => void;
}) {
  const t = useT();
  const colors = useColors();
  const styles = useThemedStyles(headerStyles);
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.filterIcon, active && styles.filterBtnOn, pressed && styles.pressed]}
      accessibilityRole="button"
      accessibilityLabel={t('common.filters')}>
      <MaterialDesignIcons
        name="filter-variant"
        size={22}
        color={active ? colors.onPrimaryContainer : colors.accent}
      />
    </Pressable>
  );
});

export const AppHeader = memo(function AppHeader({
  title,
  subtitle,
  right,
  children,
}: {
  title: string;
  subtitle?: string;
  right?: ReactNode;
  children?: ReactNode;
}) {
  const insets = useSafeAreaInsets();
  const styles = useThemedStyles(headerStyles);

  return (
    <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
      <View style={styles.row}>
        <View style={styles.titles}>
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
          {subtitle ? (
            <Text style={styles.subtitle} numberOfLines={1}>
              {subtitle}
            </Text>
          ) : null}
        </View>
        {right}
      </View>
      {children}
    </View>
  );
});

function headerStyles(colors: ThemeColors) {
  return {
    header: {
      paddingHorizontal: 20,
      paddingBottom: 12,
      backgroundColor: colors.bg,
    },
    row: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 8, minHeight: 40 },
    titles: { flex: 1, minWidth: 0 },
    title: { color: colors.text, fontSize: 22, fontFamily: fonts.bold, letterSpacing: -0.3 },
    subtitle: { color: colors.muted, fontSize: 13, fontFamily: fonts.regular, marginTop: 2 },
    filterBtn: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: 6,
      borderWidth: 1,
      borderColor: colors.chipBorder,
      backgroundColor: colors.chip,
      borderRadius: radius.full,
      paddingHorizontal: 12,
      paddingVertical: 8,
    },
    filterIcon: {
      width: 48,
      height: 48,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.chipBorder,
      backgroundColor: colors.chip,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
    },
    filterBtnOn: { backgroundColor: colors.primaryContainer, borderColor: colors.primaryContainer },
    filterLabel: { color: colors.accent, fontFamily: fonts.medium, fontSize: 12 },
    filterLabelOn: { color: colors.onPrimaryContainer },
    pressed: { opacity: 0.86 },
  };
}

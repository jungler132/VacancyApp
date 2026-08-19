import { memo } from 'react';
import { View } from 'react-native';
import MaterialDesignIcons from '@react-native-vector-icons/material-design-icons';

import { Text } from '@/components/AppText';
import { useT } from '@/lib/i18n/useT';
import { fonts, radius, useThemedStyles, type ThemeColors } from '@/lib/theme';

export const PremiumBadge = memo(function PremiumBadge({ compact }: { compact?: boolean }) {
  const t = useT();
  const styles = useThemedStyles(premiumBadgeStyles);
  return (
    <View style={[styles.badge, compact && styles.compact]}>
      <MaterialDesignIcons name="crown" size={compact ? 11 : 13} color="#ffffff" />
      <Text style={styles.label}>{t('common.premium')}</Text>
    </View>
  );
});

function premiumBadgeStyles(colors: ThemeColors) {
  return {
    badge: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: 4,
      backgroundColor: colors.orange,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: radius.full,
      flexShrink: 0,
    },
    compact: { paddingHorizontal: 6, paddingVertical: 2, gap: 3 },
    label: { color: '#ffffff', fontFamily: fonts.semibold, fontSize: 11, lineHeight: 14 },
  };
}

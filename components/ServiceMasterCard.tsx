import { memo, useCallback } from 'react';
import { Pressable, View } from 'react-native';

import { ServiceAvatar } from '@/components/ServiceAvatar';
import { PremiumBadge } from '@/components/PremiumBadge';
import { Text } from '@/components/AppText';
import { formatServiceSchedule } from '@/lib/services/hours';
import type { ServiceMaster } from '@/lib/services/types';
import { fonts, premiumGlow, premiumSurface, radius, shadowsFor, useThemedStyles, type ColorSchemeName, type ThemeColors } from '@/lib/theme';
import { keyOf } from '@/lib/i18n';
import { useT } from '@/lib/i18n/useT';

export const ServiceMasterCard = memo(function ServiceMasterCard({
  master,
  onPress,
}: {
  master: ServiceMaster;
  onPress: (id: string) => void;
}) {
  const t = useT();
  const styles = useThemedStyles(serviceMasterCardStyles);
  const kinds = [...master.kinds.map((id) => t(keyOf('kind', id))), ...(master.customKinds ?? [])]
    .filter(Boolean)
    .join(' · ');
  const hours = formatServiceSchedule(master.hours, (id) => t(keyOf('week', id)), t('week.all'));
  const count = master.offers.length;
  const featured = master.offers.some((item) => item.featured);
  const open = useCallback(() => onPress(master.id), [master.id, onPress]);

  return (
    <Pressable onPress={open} style={({ pressed }) => [styles.card, featured && styles.premium, pressed && styles.pressed]}>
      <ServiceAvatar uri={master.avatarUri} name={master.displayName} size={56} />
      <View style={styles.body}>
        <Text style={styles.name} numberOfLines={2}>
          {master.displayName}
        </Text>
        {master.mine || featured ? (
          <View style={styles.flags}>
            {master.mine ? <Text style={styles.mine}>{t('common.you')}</Text> : null}
            {featured ? <PremiumBadge compact /> : null}
          </View>
        ) : null}
        <Text style={styles.meta} numberOfLines={2}>
          {[kinds, master.address].filter(Boolean).join(' · ')}
        </Text>
        <Text style={styles.meta} numberOfLines={1}>
          {[hours || null, count ? t('services.offerCount', { count }) : t('services.noOffers')]
            .filter(Boolean)
            .join(' · ')}
        </Text>
      </View>
      <Text style={styles.chevron}>›</Text>
    </Pressable>
  );
});

function serviceMasterCardStyles(colors: ThemeColors, scheme: ColorSchemeName) {
  return {
    card: {
      flexDirection: 'row' as const,
      alignItems: 'flex-start' as const,
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.cardBorder,
      borderRadius: radius.lg,
      paddingVertical: 16,
      paddingLeft: 14,
      paddingRight: 12,
      gap: 12,
      overflow: 'hidden' as const,
      ...shadowsFor(scheme).card,
    },
    premium: {
      ...premiumSurface(colors),
      ...premiumGlow(scheme),
    },
    body: { flex: 1, minWidth: 0, gap: 4 },
    name: { color: colors.text, fontFamily: fonts.semibold, fontSize: 16, lineHeight: 22 },
    flags: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 8, flexWrap: 'wrap' as const },
    mine: { color: colors.faint, fontFamily: fonts.medium, fontSize: 12, lineHeight: 16 },
    meta: { color: colors.faint, fontFamily: fonts.medium, fontSize: 12, lineHeight: 16 },
    chevron: {
      color: colors.faint,
      fontSize: 22,
      lineHeight: 24,
      width: 18,
      textAlign: 'center' as const,
      marginTop: 8,
    },
    pressed: { opacity: 0.86 },
  };
}

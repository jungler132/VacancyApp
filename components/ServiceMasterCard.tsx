import { memo, useCallback } from 'react';
import { Pressable, View } from 'react-native';

import { ServiceAvatar } from '@/components/ServiceAvatar';
import { Text } from '@/components/AppText';
import { formatServiceSchedule } from '@/lib/services/hours';
import type { ServiceMaster } from '@/lib/services/types';
import { fonts, radius, shadowsFor, useThemedStyles, type ColorSchemeName, type ThemeColors } from '@/lib/theme';
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
    <Pressable onPress={open} style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
      <ServiceAvatar uri={master.avatarUri} name={master.displayName} size={52} />
      <View style={styles.body}>
        <View style={styles.titleRow}>
          <Text style={styles.name} numberOfLines={1}>
            {master.displayName}
          </Text>
          {master.mine ? <Text style={styles.mine}>{t('common.you')}</Text> : null}
          {featured ? <Text style={styles.mine}>{t('common.premium')}</Text> : null}
        </View>
        <Text style={styles.meta} numberOfLines={1}>
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
      alignItems: 'center' as const,
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.cardBorder,
      borderRadius: radius.lg,
      padding: 14,
      gap: 12,
      ...shadowsFor(scheme).card,
    },
    body: { flex: 1, minWidth: 0 },
    titleRow: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 8 },
    name: { flex: 1, color: colors.text, fontFamily: fonts.semibold, fontSize: 16 },
    mine: {
      color: colors.accentText,
      backgroundColor: colors.accent,
      fontFamily: fonts.semibold,
      fontSize: 11,
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: radius.full,
      overflow: 'hidden' as const,
    },
    meta: { color: colors.faint, fontFamily: fonts.medium, fontSize: 12, marginTop: 2 },
    chevron: { color: colors.faint, fontSize: 22, lineHeight: 24 },
    pressed: { opacity: 0.86 },
  };
}

import { memo, useCallback } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ServiceAvatar } from '@/components/ServiceAvatar';
import { Text } from '@/components/AppText';
import { formatServiceHours } from '@/lib/services/kinds';
import type { ServiceMaster } from '@/lib/services/types';
import { colors, fonts, radius } from '@/lib/theme';
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
  const kinds = master.kinds.map((id) => t(keyOf('kind', id))).join(' · ');
  const hours = formatServiceHours(master.hours.open, master.hours.close);
  const count = master.offers.length;
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
        </View>
        <Text style={styles.meta} numberOfLines={1}>
          {[kinds, master.address].filter(Boolean).join(' · ')}
        </Text>
        <Text style={styles.meta} numberOfLines={1}>
          {[hours ? t('services.until', { time: master.hours.close }) : null, count ? t('services.offerCount', { count }) : t('services.noOffers')]
            .filter(Boolean)
            .join(' · ')}
        </Text>
      </View>
      <Text style={styles.chevron}>›</Text>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: radius.lg,
    padding: 12,
    gap: 12,
  },
  body: { flex: 1, minWidth: 0 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  name: { flex: 1, color: colors.text, fontFamily: fonts.semibold, fontSize: 16 },
  mine: {
    color: colors.accentText,
    backgroundColor: colors.accent,
    fontFamily: fonts.semibold,
    fontSize: 11,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.sm,
    overflow: 'hidden',
  },
  meta: { color: colors.faint, fontFamily: fonts.medium, fontSize: 12, marginTop: 2 },
  chevron: { color: colors.faint, fontSize: 22, lineHeight: 24 },
  pressed: { opacity: 0.86 },
});

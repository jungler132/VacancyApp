import { memo, useCallback, useMemo } from 'react';
import { View } from 'react-native';

import { SaveStar } from '@/components/SaveStar';
import { ServiceAvatar } from '@/components/ServiceAvatar';
import { PremiumBadge } from '@/components/PremiumBadge';
import { Text } from '@/components/AppText';
import { formatServiceSchedule } from '@/lib/services/hours';
import type { ServiceMaster } from '@/lib/services/types';
import { ToneCard } from '@/components/ToneCard';
import { formatPlaceLine } from '@/lib/places';
import { fonts, useThemedStyles, type ColorSchemeName, type ThemeColors } from '@/lib/theme';
import { keyOf } from '@/lib/i18n';
import { useLocale, useT } from '@/lib/i18n/useT';
import { useAppDispatch, useAppSelector } from '@/lib/store/hooks';
import { toSavedMaster, toggleSavedService } from '@/lib/store/savedServicesSlice';
import { selectIsServiceSaved } from '@/lib/store/selectors';

export const ServiceMasterCard = memo(function ServiceMasterCard({
  master,
  onPress,
}: {
  master: ServiceMaster;
  onPress: (id: string) => void;
}) {
  const t = useT();
  const locale = useLocale();
  const dispatch = useAppDispatch();
  const styles = useThemedStyles(serviceMasterCardStyles);
  const kinds = [...master.kinds.map((id) => t(keyOf('kind', id))), ...(master.customKinds ?? [])]
    .filter(Boolean)
    .join(' · ');
  const hours = formatServiceSchedule(master.hours, (id) => t(keyOf('week', id)), t('week.all'));
  const place = formatPlaceLine(locale, master.cityId, master.address);
  const count = master.offers.length;
  const featured = master.offers.some((item) => item.featured);
  const savedRef = useMemo(
    () => ({ kind: 'master' as const, id: master.id, profileId: master.id }),
    [master.id],
  );
  const saved = useAppSelector(selectIsServiceSaved(savedRef));
  const open = useCallback(() => onPress(master.id), [master.id, onPress]);
  const onToggle = useCallback(() => {
    dispatch(toggleSavedService(toSavedMaster(master)));
  }, [dispatch, master]);

  return (
    <ToneCard tone={featured ? 'premium' : 'default'} onPress={open} style={styles.card}>
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
          {[kinds, place].filter(Boolean).join(' · ')}
        </Text>
        <Text style={styles.meta} numberOfLines={1}>
          {[hours || null, count ? t('services.offerCount', { count }) : t('services.noOffers')]
            .filter(Boolean)
            .join(' · ')}
        </Text>
      </View>
      {master.mine ? (
        <Text style={styles.chevron}>›</Text>
      ) : (
        <View style={styles.star}>
          <SaveStar saved={saved} onToggle={onToggle} />
        </View>
      )}
    </ToneCard>
  );
});

function serviceMasterCardStyles(colors: ThemeColors, _scheme: ColorSchemeName) {
  return {
    card: {
      flexDirection: 'row' as const,
      alignItems: 'flex-start' as const,
      paddingVertical: 16,
      paddingLeft: 14,
      paddingRight: 12,
      gap: 12,
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
    star: { marginTop: 6 },
  };
}

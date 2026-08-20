import { memo, useCallback, useMemo } from 'react';
import { View } from 'react-native';

import { AppImage } from '@/components/AppImage';
import { SaveStar } from '@/components/SaveStar';
import { ServicePhotoGrid } from '@/components/ServicePhotoGrid';
import { PremiumBadge } from '@/components/PremiumBadge';
import { Text } from '@/components/AppText';
import { ToneCard } from '@/components/ToneCard';
import { formatPlaceLine } from '@/lib/places';
import { offerContact, offerKindLabel, offerPriceLabel } from '@/lib/services/catalog';
import { keyOf } from '@/lib/i18n';
import { useLocale, useT } from '@/lib/i18n/useT';
import { OWN_PROFILE_ID } from '@/lib/store/freelanceSlice';
import { useAppDispatch, useAppSelector } from '@/lib/store/hooks';
import { toSavedOffer, toggleSavedService } from '@/lib/store/savedServicesSlice';
import { selectIsServiceSaved } from '@/lib/store/selectors';
import type { ServiceOffer, ServiceProfile } from '@/lib/services/types';
import { fonts, radius, useThemedStyles, type ColorSchemeName, type ThemeColors } from '@/lib/theme';

export const ServiceOfferCard = memo(function ServiceOfferCard({
  offer,
  profile,
  onPress,
}: {
  offer: ServiceOffer;
  profile: ServiceProfile;
  onPress?: (id: string) => void;
}) {
  const t = useT();
  const locale = useLocale();
  const dispatch = useAppDispatch();
  const styles = useThemedStyles(serviceOfferCardStyles);
  const contact = offerContact(offer, profile);
  const kind = offerKindLabel(offer, (id) => t(keyOf('kind', id)));
  const extras = offer.images.slice(1);
  const canSave = profile.id !== OWN_PROFILE_ID;
  const place = formatPlaceLine(locale, offer.cityId || profile.cityId, contact.address);
  const savedRef = useMemo(
    () => ({ kind: 'offer' as const, id: offer.id, profileId: profile.id }),
    [offer.id, profile.id],
  );
  const saved = useAppSelector(selectIsServiceSaved(savedRef));
  const press = useCallback(() => onPress?.(offer.id), [offer.id, onPress]);
  const onToggle = useCallback(() => {
    dispatch(toggleSavedService(toSavedOffer(offer, profile)));
  }, [dispatch, offer, profile]);

  return (
    <ToneCard
      tone={offer.archived ? 'default' : offer.featured ? 'premium' : 'default'}
      onPress={onPress ? press : undefined}
      style={[styles.card, offer.archived && styles.archived]}>
      {offer.images[0] ? <AppImage uri={offer.images[0]} style={styles.image} /> : null}
      <View style={styles.titleRow}>
        <Text style={styles.title}>{offer.title}</Text>
        {offer.featured && !offer.archived ? <PremiumBadge compact /> : null}
        {canSave ? <SaveStar saved={saved} onToggle={onToggle} /> : null}
      </View>
      {offer.archived ? <Text style={styles.kind}>{t('common.archived')}</Text> : null}
      <Text style={styles.price}>{offerPriceLabel(offer, t('services.priceNegotiable'))}</Text>
      <Text style={styles.kind}>{kind}</Text>
      {offer.description ? (
        <Text style={styles.body} numberOfLines={4}>
          {offer.description}
        </Text>
      ) : null}
      {extras.length ? <ServicePhotoGrid uris={extras} /> : null}
      {place ? <Text style={styles.meta}>{place}</Text> : null}
      {contact.phone ? <Text style={styles.meta}>{contact.phone}</Text> : null}
    </ToneCard>
  );
});

function serviceOfferCardStyles(colors: ThemeColors, _scheme: ColorSchemeName) {
  return {
    card: {
      padding: 16,
      gap: 4,
    },
    image: { width: '100%' as const, height: 160, borderRadius: radius.md, marginBottom: 8, backgroundColor: colors.chip },
    titleRow: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 8 },
    title: { flex: 1, color: colors.text, fontFamily: fonts.semibold, fontSize: 17 },
    price: { color: colors.salary, fontFamily: fonts.semibold, fontSize: 16, marginTop: 2 },
    kind: { color: colors.accent, fontFamily: fonts.medium, fontSize: 12 },
    body: { color: colors.text, fontFamily: fonts.regular, fontSize: 15, lineHeight: 22, marginTop: 6 },
    meta: { color: colors.faint, fontFamily: fonts.medium, fontSize: 13, marginTop: 2 },
    archived: { opacity: 0.62 },
  };
}

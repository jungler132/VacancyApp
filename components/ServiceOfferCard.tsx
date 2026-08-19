import { memo, useCallback } from 'react';
import { Pressable, View } from 'react-native';

import { AppImage } from '@/components/AppImage';
import { ServicePhotoGrid } from '@/components/ServicePhotoGrid';
import { PremiumBadge } from '@/components/PremiumBadge';
import { Text } from '@/components/AppText';
import { offerContact, offerKindLabel, offerPriceLabel } from '@/lib/services/catalog';
import { keyOf } from '@/lib/i18n';
import { useT } from '@/lib/i18n/useT';
import type { ServiceOffer, ServiceProfile } from '@/lib/services/types';
import { fonts, premiumGlow, premiumSurface, radius, shadowsFor, useThemedStyles, type ColorSchemeName, type ThemeColors } from '@/lib/theme';

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
  const styles = useThemedStyles(serviceOfferCardStyles);
  const contact = offerContact(offer, profile);
  const kind = offerKindLabel(offer, (id) => t(keyOf('kind', id)));
  const extras = offer.images.slice(1);
  const press = useCallback(() => onPress?.(offer.id), [offer.id, onPress]);

  return (
    <Pressable
      onPress={press}
      disabled={!onPress}
      style={({ pressed }) => [styles.card, offer.featured && styles.premium, pressed && styles.pressed]}>
      {offer.images[0] ? <AppImage uri={offer.images[0]} style={styles.image} /> : null}
      <View style={styles.titleRow}>
        <Text style={styles.title}>{offer.title}</Text>
        {offer.featured ? <PremiumBadge compact /> : null}
      </View>
      <Text style={styles.price}>{offerPriceLabel(offer, t('services.priceNegotiable'))}</Text>
      <Text style={styles.kind}>{kind}</Text>
      {offer.description ? (
        <Text style={styles.body} numberOfLines={4}>
          {offer.description}
        </Text>
      ) : null}
      {extras.length ? <ServicePhotoGrid uris={extras} /> : null}
      {contact.address ? <Text style={styles.meta}>{contact.address}</Text> : null}
      {contact.phone ? <Text style={styles.meta}>{contact.phone}</Text> : null}
    </Pressable>
  );
});

function serviceOfferCardStyles(colors: ThemeColors, scheme: ColorSchemeName) {
  return {
    card: {
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.cardBorder,
      borderRadius: radius.lg,
      padding: 16,
      gap: 4,
      overflow: 'hidden' as const,
      ...shadowsFor(scheme).card,
    },
    premium: {
      ...premiumSurface(colors),
      ...premiumGlow(scheme),
    },
    image: { width: '100%' as const, height: 160, borderRadius: radius.md, marginBottom: 8, backgroundColor: colors.chip },
    titleRow: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 8 },
    title: { flex: 1, color: colors.text, fontFamily: fonts.semibold, fontSize: 17 },
    price: { color: colors.salary, fontFamily: fonts.semibold, fontSize: 16, marginTop: 2 },
    kind: { color: colors.accent, fontFamily: fonts.medium, fontSize: 12 },
    body: { color: colors.text, fontFamily: fonts.regular, fontSize: 15, lineHeight: 22, marginTop: 6 },
    meta: { color: colors.faint, fontFamily: fonts.medium, fontSize: 13, marginTop: 2 },
    pressed: { opacity: 0.86 },
  };
}

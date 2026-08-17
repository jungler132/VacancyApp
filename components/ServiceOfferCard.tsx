import { memo, useCallback } from 'react';
import { Image, Pressable, StyleSheet } from 'react-native';

import { Text } from '@/components/AppText';
import { offerContact, offerPriceLabel } from '@/lib/services/catalog';
import { keyOf } from '@/lib/i18n';
import { useT } from '@/lib/i18n/useT';
import type { ServiceOffer, ServiceProfile } from '@/lib/services/types';
import { colors, fonts, radius } from '@/lib/theme';

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
  const contact = offerContact(offer, profile);
  const press = useCallback(() => onPress?.(offer.id), [offer.id, onPress]);

  return (
    <Pressable onPress={press} disabled={!onPress} style={styles.card}>
      {offer.images[0] ? <Image source={{ uri: offer.images[0] }} style={styles.image} /> : null}
      <Text style={styles.title}>{offer.title}</Text>
      <Text style={styles.price}>{offerPriceLabel(offer, t('services.priceNegotiable'))}</Text>
      <Text style={styles.kind}>{t(keyOf('kind', offer.kind))}</Text>
      {offer.description ? <Text style={styles.body}>{offer.description}</Text> : null}
      {contact.address ? <Text style={styles.meta}>{contact.address}</Text> : null}
      {contact.phone ? <Text style={styles.meta}>{contact.phone}</Text> : null}
    </Pressable>
  );
});

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: radius.lg,
    padding: 14,
    gap: 4,
  },
  image: { width: '100%', height: 160, borderRadius: radius.md, marginBottom: 8, backgroundColor: colors.chip },
  title: { color: colors.text, fontFamily: fonts.semibold, fontSize: 17 },
  price: { color: colors.salary, fontFamily: fonts.semibold, fontSize: 16, marginTop: 2 },
  kind: { color: colors.accent, fontFamily: fonts.medium, fontSize: 12 },
  body: { color: colors.text, fontFamily: fonts.regular, fontSize: 15, lineHeight: 22, marginTop: 6 },
  meta: { color: colors.faint, fontFamily: fonts.medium, fontSize: 13, marginTop: 2 },
});

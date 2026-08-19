import { useCallback, useLayoutEffect, useMemo, useState } from 'react';
import { Linking, Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router';

import { AppImage } from '@/components/AppImage';
import { EmptyState } from '@/components/EmptyState';
import { useFormStyles } from '@/components/FormField';
import { PremiumBadge } from '@/components/PremiumBadge';
import { ReportSheet } from '@/components/ReportSheet';
import { Text } from '@/components/AppText';
import { keyOf } from '@/lib/i18n';
import { useT } from '@/lib/i18n/useT';
import { offerContact, offerEditorHref, offerKindLabel, offerPriceLabel } from '@/lib/services/catalog';
import { useAppSelector } from '@/lib/store/hooks';
import { selectOfferView } from '@/lib/store/selectors';
import { fonts, premiumGlow, premiumSurface, radius, useThemedStyles, type ColorSchemeName, type ThemeColors } from '@/lib/theme';

export default function ServiceOfferViewScreen() {
  const t = useT();
  const router = useRouter();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const formStyles = useFormStyles();
  const styles = useThemedStyles(offerViewStyles);
  const { id } = useLocalSearchParams<{ id: string | string[] }>();
  const offerId = Array.isArray(id) ? id[0] : String(id ?? '');
  const view = useAppSelector((state) => selectOfferView(state, offerId));
  const signedIn = useAppSelector((state) => Boolean(state.auth.userId && state.auth.email && !state.auth.anonymous));
  const [reportOpen, setReportOpen] = useState(false);
  const offer = view?.offer;
  const master = view?.master;
  const contact = useMemo(
    () => (offer && master ? offerContact(offer, master) : { phone: '', address: '' }),
    [master, offer],
  );
  const kind = offer ? offerKindLabel(offer, (item) => t(keyOf('kind', item))) : '';

  useLayoutEffect(() => {
    navigation.setOptions({ title: offer?.title || t('nav.offer') });
  }, [navigation, offer?.title, t]);

  const call = useCallback(() => {
    const phone = contact.phone.replace(/\s+/g, '');
    if (phone) Linking.openURL(`tel:${phone}`);
  }, [contact.phone]);

  const edit = useCallback(() => {
    if (offer) router.push(offerEditorHref(offer.id));
  }, [offer, router]);
  const openReport = useCallback(() => setReportOpen(true), []);
  const closeReport = useCallback(() => setReportOpen(false), []);

  if (!offer || !master) {
    return (
      <View style={formStyles.center}>
        <EmptyState title={t('offer.notFound')} subtitle={t('offer.notFoundHint')} />
      </View>
    );
  }

  return (
    <ScrollView
      style={formStyles.screen}
      contentContainerStyle={[formStyles.content, { paddingBottom: Math.max(insets.bottom, 16) + 32 }]}>
      {offer.featured ? (
        <View style={styles.hero}>
          <View style={styles.stripe} />
          <PremiumBadge />
          <Text style={styles.heroNote}>{t('offer.featuredOn')}</Text>
        </View>
      ) : null}
      {offer.images.map((uri) => (
        <AppImage key={uri} uri={uri} style={styles.photo} />
      ))}
      <View style={styles.titleRow}>
        <Text style={styles.title}>{offer.title}</Text>
      </View>
      <Text style={styles.price}>{offerPriceLabel(offer, t('services.priceNegotiable'))}</Text>
      {kind ? <Text style={styles.kind}>{kind}</Text> : null}
      {offer.description ? <Text style={styles.body}>{offer.description}</Text> : null}
      {contact.address ? <Text style={styles.meta}>{t('master.address', { value: contact.address })}</Text> : null}
      {contact.phone ? (
        <Pressable onPress={call}>
          <Text style={styles.link}>{t('master.phone', { value: contact.phone })}</Text>
        </Pressable>
      ) : null}
      {master.mine ? (
        <Pressable onPress={edit} style={({ pressed }) => [formStyles.secondary, pressed && formStyles.pressed]}>
          <Text style={formStyles.secondaryText}>{t('offer.edit')}</Text>
        </Pressable>
      ) : signedIn ? (
        <Pressable onPress={openReport} style={({ pressed }) => [formStyles.secondary, pressed && formStyles.pressed]}>
          <Text style={formStyles.secondaryText}>{t('report.action')}</Text>
        </Pressable>
      ) : null}
      {contact.phone ? (
        <Pressable onPress={call} style={({ pressed }) => [formStyles.primary, pressed && formStyles.pressed]}>
          <Text style={formStyles.primaryText}>{t('offer.call')}</Text>
        </Pressable>
      ) : null}
      <ReportSheet
        open={reportOpen}
        target={offer && master ? { kind: 'offer', id: offer.id, title: `${offer.title} · ${master.displayName}` } : null}
        onClose={closeReport}
      />
    </ScrollView>
  );
}

function offerViewStyles(colors: ThemeColors, scheme: ColorSchemeName) {
  return {
    hero: {
      ...premiumSurface(colors),
      ...premiumGlow(scheme),
      borderRadius: radius.lg,
      borderWidth: 1,
      paddingHorizontal: 16,
      paddingVertical: 14,
      overflow: 'hidden' as const,
      gap: 8,
    },
    stripe: {
      position: 'absolute' as const,
      left: 0,
      top: 0,
      bottom: 0,
      width: 4,
      backgroundColor: colors.orange,
    },
    heroNote: { color: colors.text, fontFamily: fonts.medium, fontSize: 13, lineHeight: 18, paddingLeft: 4 },
    photo: {
      width: '100%' as const,
      height: 240,
      borderRadius: radius.lg,
      backgroundColor: colors.chip,
    },
    titleRow: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 8 },
    title: { flex: 1, color: colors.text, fontFamily: fonts.bold, fontSize: 24, lineHeight: 30 },
    price: { color: colors.salary, fontFamily: fonts.bold, fontSize: 20 },
    kind: { color: colors.accent, fontFamily: fonts.medium, fontSize: 13 },
    body: { color: colors.text, fontFamily: fonts.regular, fontSize: 16, lineHeight: 24 },
    meta: { color: colors.faint, fontFamily: fonts.medium, fontSize: 14 },
    link: { color: colors.accent, fontFamily: fonts.semibold, fontSize: 15 },
  };
}

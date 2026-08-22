import { useCallback, useLayoutEffect, useMemo, useState } from 'react';
import { Linking, Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router';

import { AppImage } from '@/components/AppImage';
import { EmptyState } from '@/components/EmptyState';
import { useFormStyles } from '@/components/FormField';
import { PremiumBadge } from '@/components/PremiumBadge';
import { PhotoLightbox } from '@/components/PhotoLightbox';
import { ReportSheet } from '@/components/ReportSheet';
import { SaveStar } from '@/components/SaveStar';
import { Text } from '@/components/AppText';
import { keyOf } from '@/lib/i18n';
import { useLocale, useT } from '@/lib/i18n/useT';
import { ToneCard } from '@/components/ToneCard';
import { formatPlaceLine } from '@/lib/places';
import { offerContact, offerEditorHref, offerKindLabel, offerPriceLabel } from '@/lib/services/catalog';
import { useAppDispatch, useAppSelector } from '@/lib/store/hooks';
import { setOfferArchived } from '@/lib/store/freelanceSlice';
import { toSavedOffer, toggleSavedService } from '@/lib/store/savedServicesSlice';
import { selectIsServiceSaved, selectOfferView } from '@/lib/store/selectors';
import { fonts, radius, useThemedStyles, type ColorSchemeName, type ThemeColors } from '@/lib/theme';

export default function ServiceOfferViewScreen() {
  const t = useT();
  const locale = useLocale();
  const router = useRouter();
  const navigation = useNavigation();
  const dispatch = useAppDispatch();
  const insets = useSafeAreaInsets();
  const formStyles = useFormStyles();
  const styles = useThemedStyles(offerViewStyles);
  const { id } = useLocalSearchParams<{ id: string | string[] }>();
  const offerId = Array.isArray(id) ? id[0] : String(id ?? '');
  const view = useAppSelector((state) => selectOfferView(state, offerId));
  const signedIn = useAppSelector((state) => Boolean(state.auth.userId && state.auth.email && !state.auth.anonymous));
  const [reportOpen, setReportOpen] = useState(false);
  const [preview, setPreview] = useState<number | null>(null);
  const offer = view?.offer;
  const master = view?.master;
  const savedRef = useMemo(
    () => ({ kind: 'offer' as const, id: offerId, profileId: master?.id ?? '' }),
    [master?.id, offerId],
  );
  const saved = useAppSelector(selectIsServiceSaved(savedRef));
  const contact = useMemo(
    () => (offer && master ? offerContact(offer, master) : { phone: '', address: '' }),
    [master, offer],
  );
  const place = offer && master ? formatPlaceLine(locale, offer.cityId || master.cityId, contact.address) : '';
  const kind = offer ? offerKindLabel(offer, (item) => t(keyOf('kind', item)), master.customKinds) : '';

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
  const onArchive = useCallback(() => {
    if (!offer || !master?.mine) return;
    dispatch(setOfferArchived({ id: offer.id, archived: !offer.archived }));
  }, [dispatch, master?.mine, offer]);
  const openReport = useCallback(() => setReportOpen(true), []);
  const closeReport = useCallback(() => setReportOpen(false), []);
  const onToggleSave = useCallback(() => {
    if (offer && master && !master.mine) dispatch(toggleSavedService(toSavedOffer(offer, master)));
  }, [dispatch, master, offer]);

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
      {offer.archived ? (
        <ToneCard tone="default" style={styles.hero}>
          <Text style={styles.heroNote}>{t('common.archived')}</Text>
        </ToneCard>
      ) : offer.featured ? (
        <ToneCard tone="premium" style={styles.hero}>
          <PremiumBadge />
          <Text style={styles.heroNote}>{t('offer.featuredOn')}</Text>
        </ToneCard>
      ) : null}
      {offer.images.map((uri, index) => (
        <Pressable key={uri} onPress={() => setPreview(index)}>
          <AppImage uri={uri} style={styles.photo} />
        </Pressable>
      ))}
      <View style={styles.titleRow}>
        <Text style={styles.title}>{offer.title}</Text>
        {master.mine ? null : <SaveStar saved={saved} onToggle={onToggleSave} />}
      </View>
      <Text style={styles.price}>{offerPriceLabel(offer, t('services.priceNegotiable'))}</Text>
      {kind ? <Text style={styles.kind}>{kind}</Text> : null}
      {offer.description ? <Text style={styles.body}>{offer.description}</Text> : null}
      {place ? <Text style={styles.meta}>{t('master.address', { value: place })}</Text> : null}
      {contact.phone ? (
        <Pressable onPress={call}>
          <Text style={styles.link}>{t('master.phone', { value: contact.phone })}</Text>
        </Pressable>
      ) : null}
      {master.mine ? (
        <>
          <Pressable onPress={edit} style={({ pressed }) => [formStyles.secondary, pressed && formStyles.pressed]}>
            <Text style={formStyles.secondaryText}>{t('offer.edit')}</Text>
          </Pressable>
          <Pressable onPress={onArchive} style={({ pressed }) => [formStyles.secondary, pressed && formStyles.pressed]}>
            <Text style={formStyles.secondaryText}>{offer.archived ? t('offer.restore') : t('offer.archive')}</Text>
          </Pressable>
        </>
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
      {preview != null ? (
        <PhotoLightbox uris={offer.images} index={preview} onClose={() => setPreview(null)} />
      ) : null}
    </ScrollView>
  );
}

function offerViewStyles(colors: ThemeColors, _scheme: ColorSchemeName) {
  return {
    hero: {
      paddingHorizontal: 16,
      paddingVertical: 14,
      gap: 8,
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

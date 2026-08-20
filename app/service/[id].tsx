import { useCallback, useEffect, useLayoutEffect, useMemo, useState } from 'react';
import { Linking, Pressable, ScrollView, View } from 'react-native';
import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router';

import { EmptyState } from '@/components/EmptyState';
import { useFormStyles } from '@/components/FormField';
import { ReportSheet } from '@/components/ReportSheet';
import { SaveStar } from '@/components/SaveStar';
import { ServiceAvatar } from '@/components/ServiceAvatar';
import { ServiceOfferCard } from '@/components/ServiceOfferCard';
import { ServicePhotoGrid } from '@/components/ServicePhotoGrid';
import { Text } from '@/components/AppText';
import { requestInterstitial } from '@/lib/ads';
import { keyOf } from '@/lib/i18n';
import { useLocale, useT } from '@/lib/i18n/useT';
import { formatPlaceLine } from '@/lib/places';
import { liveOffers, offerEditorHref, offerViewHref, SERVICE_ME_HREF } from '@/lib/services/catalog';
import { formatServiceSchedule } from '@/lib/services/hours';
import { useLimits } from '@/lib/hooks/useLimits';
import { useAppDispatch, useAppSelector } from '@/lib/store/hooks';
import { toSavedMaster, toggleSavedService } from '@/lib/store/savedServicesSlice';
import { selectIsServiceSaved, selectMasterById } from '@/lib/store/selectors';
import { fonts, useThemedStyles, type ColorSchemeName, type ThemeColors } from '@/lib/theme';

export default function ServicePublicScreen() {
  const t = useT();
  const locale = useLocale();
  const router = useRouter();
  const navigation = useNavigation();
  const dispatch = useAppDispatch();
  const formStyles = useFormStyles();
  const styles = useThemedStyles(servicePublicStyles);
  const { id } = useLocalSearchParams<{ id: string | string[] }>();
  const profileId = Array.isArray(id) ? id.join('/') : String(id ?? '');
  const master = useAppSelector((state) => selectMasterById(state, profileId));
  const savedRef = useMemo(
    () => ({ kind: 'master' as const, id: profileId, profileId }),
    [profileId],
  );
  const saved = useAppSelector(selectIsServiceSaved(savedRef));
  const signedIn = useAppSelector((state) => Boolean(state.auth.userId && state.auth.email && !state.auth.anonymous));
  const [reportOpen, setReportOpen] = useState(false);
  const limits = useLimits();
  const hours = formatServiceSchedule(
    master?.hours,
    (id) => t(keyOf('week', id)),
    t('week.all'),
  );
  const kinds = useMemo(() => {
    if (!master) return '';
    return [...master.kinds.map((id) => t(keyOf('kind', id))), ...(master.customKinds ?? [])].filter(Boolean).join(' · ');
  }, [master, t]);
  const gallery = useMemo(
    () => (master?.photos ?? []).filter((uri) => uri && uri !== master?.avatarUri),
    [master?.avatarUri, master?.photos],
  );
  const offers = useMemo(() => {
    if (!master) return [];
    return master.mine ? master.offers : liveOffers(master.offers);
  }, [master]);

  useEffect(() => {
    if (!profileId || master?.mine) return;
    requestInterstitial();
  }, [master?.mine, profileId]);

  const call = useCallback(() => {
    const phone = master?.phone?.trim();
    if (phone) Linking.openURL(`tel:${phone.replace(/\s+/g, '')}`);
  }, [master?.phone]);

  const mail = useCallback(() => {
    const email = master?.email?.trim();
    if (email) Linking.openURL(`mailto:${email}`);
  }, [master?.email]);

  const goEdit = useCallback(() => router.push(SERVICE_ME_HREF), [router]);
  const addOffer = useCallback(() => {
    if (!master?.mine || master.offers.length >= limits.offers) return;
    router.push(offerEditorHref('new'));
  }, [limits.offers, master, router]);
  const openOffer = useCallback((offerId: string) => router.push(offerViewHref(offerId)), [router]);
  const openReport = useCallback(() => setReportOpen(true), []);
  const closeReport = useCallback(() => setReportOpen(false), []);
  const onToggleSave = useCallback(() => {
    if (master && !master.mine) dispatch(toggleSavedService(toSavedMaster(master)));
  }, [dispatch, master]);

  useLayoutEffect(() => {
    navigation.setOptions({ title: master?.displayName || t('nav.master') });
  }, [master?.displayName, navigation, t]);

  if (!master) {
    return (
      <View style={formStyles.center}>
        <EmptyState title={t('master.notFound')} subtitle={t('master.notFoundHint')} />
      </View>
    );
  }

  return (
    <ScrollView style={formStyles.screen} contentContainerStyle={formStyles.content}>
      <View style={styles.head}>
        <ServiceAvatar uri={master.avatarUri} name={master.displayName} size={72} />
        <View style={styles.headBody}>
          <View style={styles.nameRow}>
            <Text style={styles.name}>{master.displayName}</Text>
            {master.mine ? null : <SaveStar saved={saved} onToggle={onToggleSave} />}
          </View>
          {kinds ? <Text style={styles.meta}>{kinds}</Text> : null}
          {hours ? <Text style={styles.meta}>{t('master.hours', { value: hours })}</Text> : null}
          {master.mine ? <Text style={styles.mine}>{t('master.mine')}</Text> : null}
        </View>
      </View>
      {master.bio ? <Text style={styles.bio}>{master.bio}</Text> : null}
      {gallery.length ? (
        <>
          <Text style={styles.section}>{t('master.gallery')}</Text>
          <ServicePhotoGrid uris={gallery} />
        </>
      ) : null}
      {formatPlaceLine(locale, master.cityId, master.address) ? (
        <Text style={styles.meta}>{t('master.address', { value: formatPlaceLine(locale, master.cityId, master.address) })}</Text>
      ) : null}
      {master.phone ? (
        <Pressable onPress={call}>
          <Text style={styles.link}>{t('master.phone', { value: master.phone })}</Text>
        </Pressable>
      ) : null}
      {master.email ? (
        <Pressable onPress={mail}>
          <Text style={styles.link}>{t('master.email', { value: master.email })}</Text>
        </Pressable>
      ) : null}

      {master.mine ? (
        <View style={styles.actions}>
          <Pressable onPress={goEdit} style={({ pressed }) => [formStyles.secondary, pressed && formStyles.pressed]}>
            <Text style={formStyles.secondaryText}>{t('master.edit')}</Text>
          </Pressable>
          <Pressable onPress={addOffer} style={({ pressed }) => [formStyles.primary, pressed && formStyles.pressed]}>
            <Text style={formStyles.primaryText}>{t('master.addOffer')}</Text>
          </Pressable>
        </View>
      ) : signedIn ? (
        <Pressable onPress={openReport} style={({ pressed }) => [formStyles.secondary, pressed && formStyles.pressed]}>
          <Text style={formStyles.secondaryText}>{t('report.action')}</Text>
        </Pressable>
      ) : null}

      <Text style={styles.section}>{t('master.offers')}</Text>
      {offers.length ? (
        offers.map((offer) => (
          <ServiceOfferCard key={offer.id} offer={offer} profile={master} onPress={openOffer} />
        ))
      ) : (
        <Text style={styles.empty}>{t('master.empty')}</Text>
      )}
      <ReportSheet
        open={reportOpen}
        target={master ? { kind: 'master', id: master.id, title: master.displayName } : null}
        onClose={closeReport}
      />
    </ScrollView>
  );
}

function servicePublicStyles(colors: ThemeColors, _scheme: ColorSchemeName) {
  return {
    head: { flexDirection: 'row' as const, gap: 14, alignItems: 'center' as const },
    headBody: { flex: 1, minWidth: 0 },
    nameRow: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 8 },
    name: { flex: 1, color: colors.text, fontFamily: fonts.bold, fontSize: 22 },
    meta: { color: colors.faint, fontFamily: fonts.medium, fontSize: 13, marginTop: 2 },
    mine: { color: colors.accent, fontFamily: fonts.semibold, fontSize: 12, marginTop: 6 },
    bio: { color: colors.text, fontFamily: fonts.regular, fontSize: 16, lineHeight: 24, marginTop: 8 },
    link: { color: colors.accent, fontFamily: fonts.semibold, fontSize: 15 },
    actions: { gap: 8, marginTop: 8 },
    section: {
      color: colors.muted,
      fontFamily: fonts.semibold,
      fontSize: 12,
      textTransform: 'uppercase' as const,
      marginTop: 12,
    },
    empty: { color: colors.faint, fontFamily: fonts.medium, fontSize: 13 },
  };
}

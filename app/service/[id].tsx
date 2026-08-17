import { useCallback, useMemo } from 'react';
import { Linking, Pressable, ScrollView, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { EmptyState } from '@/components/EmptyState';
import { useFormStyles } from '@/components/FormField';
import { ServiceAvatar } from '@/components/ServiceAvatar';
import { ServiceOfferCard } from '@/components/ServiceOfferCard';
import { Text } from '@/components/AppText';
import { keyOf } from '@/lib/i18n';
import { useT } from '@/lib/i18n/useT';
import { offerEditorHref, SERVICE_ME_HREF } from '@/lib/services/catalog';
import { formatServiceHours } from '@/lib/services/kinds';
import { OFFERS_LIMIT } from '@/lib/store/freelanceSlice';
import { useAppSelector } from '@/lib/store/hooks';
import { selectMasterById } from '@/lib/store/selectors';
import { fonts, useThemedStyles, type ColorSchemeName, type ThemeColors } from '@/lib/theme';

export default function ServicePublicScreen() {
  const t = useT();
  const router = useRouter();
  const formStyles = useFormStyles();
  const styles = useThemedStyles(servicePublicStyles);
  const { id } = useLocalSearchParams<{ id: string | string[] }>();
  const profileId = Array.isArray(id) ? id.join('/') : String(id ?? '');
  const master = useAppSelector((state) => selectMasterById(state, profileId));
  const hours = formatServiceHours(master?.hours.open, master?.hours.close);
  const kinds = useMemo(
    () => (master ? master.kinds.map((id) => t(keyOf('kind', id))).join(' · ') : ''),
    [master, t],
  );

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
    if (!master?.mine || master.offers.length >= OFFERS_LIMIT) return;
    router.push(offerEditorHref('new'));
  }, [master, router]);
  const editOffer = useCallback((offerId: string) => router.push(offerEditorHref(offerId)), [router]);

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
          <Text style={styles.name}>{master.displayName}</Text>
          {kinds ? <Text style={styles.meta}>{kinds}</Text> : null}
          {hours ? <Text style={styles.meta}>{t('master.hours', { value: hours })}</Text> : null}
          {master.mine ? <Text style={styles.mine}>{t('master.mine')}</Text> : null}
        </View>
      </View>
      {master.bio ? <Text style={styles.bio}>{master.bio}</Text> : null}
      {master.address ? <Text style={styles.meta}>{t('master.address', { value: master.address })}</Text> : null}
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
      ) : null}

      <Text style={styles.section}>{t('master.offers')}</Text>
      {master.offers.length ? (
        master.offers.map((offer) => (
          <ServiceOfferCard
            key={offer.id}
            offer={offer}
            profile={master}
            onPress={master.mine ? editOffer : undefined}
          />
        ))
      ) : (
        <Text style={styles.empty}>{t('master.empty')}</Text>
      )}
    </ScrollView>
  );
}

function servicePublicStyles(colors: ThemeColors, _scheme: ColorSchemeName) {
  return {
    head: { flexDirection: 'row' as const, gap: 14, alignItems: 'center' as const },
    headBody: { flex: 1, minWidth: 0 },
    name: { color: colors.text, fontFamily: fonts.bold, fontSize: 22 },
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

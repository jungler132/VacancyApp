import { memo, useCallback, useMemo, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';

import { ChipWrap } from '@/components/ChipWrap';
import { SelectChip } from '@/components/FilterChips';
import { FormField, useFormStyles } from '@/components/FormField';
import { ServiceAvatar } from '@/components/ServiceAvatar';
import { TimeWheel } from '@/components/TimeWheel';
import { WeekdayStrip } from '@/components/WeekdayStrip';
import { Text } from '@/components/AppText';
import { keyOf } from '@/lib/i18n';
import { useT } from '@/lib/i18n/useT';
import { masterHref, offerEditorHref, offerPriceLabel } from '@/lib/services/catalog';
import { formatServiceSchedule, WORKDAYS } from '@/lib/services/hours';
import { pickServiceImage } from '@/lib/services/images';
import { SERVICE_KINDS } from '@/lib/services/kinds';
import type { ServiceKindId, WeekdayId } from '@/lib/services/types';
import { CUSTOM_KINDS_LIMIT, OWN_PROFILE_ID, emptyProfile, saveProfile } from '@/lib/store/freelanceSlice';
import { useLimits } from '@/lib/hooks/useLimits';
import { useAppDispatch, useAppSelector } from '@/lib/store/hooks';
import { selectOwnMaster } from '@/lib/store/selectors';
import { fonts, radius, useThemedStyles, type ColorSchemeName, type ThemeColors } from '@/lib/theme';

export default function ServiceProfileEditor() {
  const ready = useAppSelector((state) => state.freelance.ready);
  const formStyles = useFormStyles();
  if (!ready) return <View style={formStyles.screen} />;
  return <ProfileForm />;
}

function ProfileForm() {
  const t = useT();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const formStyles = useFormStyles();
  const styles = useThemedStyles(serviceMeStyles);
  const own = useAppSelector(selectOwnMaster);
  const limits = useLimits();
  const seed = useMemo(() => own ?? emptyProfile(), [own]);
  const [displayName, setDisplayName] = useState(seed.displayName);
  const [bio, setBio] = useState(seed.bio);
  const [email, setEmail] = useState(seed.email);
  const [phone, setPhone] = useState(seed.phone);
  const [address, setAddress] = useState(seed.address ?? '');
  const [avatarUri, setAvatarUri] = useState(seed.avatarUri);
  const [kinds, setKinds] = useState<ServiceKindId[]>(seed.kinds);
  const [customKinds, setCustomKinds] = useState<string[]>(seed.customKinds ?? []);
  const [customKindDraft, setCustomKindDraft] = useState('');
  const [open, setOpen] = useState(seed.hours.open);
  const [close, setClose] = useState(seed.hours.close);
  const [days, setDays] = useState<WeekdayId[]>(seed.hours.days?.length ? seed.hours.days : [...WORKDAYS]);
  const hoursLabel = useMemo(
    () => formatServiceSchedule({ open, close, days }, (id) => t(keyOf('week', id)), t('week.all')),
    [close, days, open, t],
  );

  const toggleKind = useCallback((id: string | number) => {
    const next = id as ServiceKindId;
    setKinds((current) => (current.includes(next) ? current.filter((item) => item !== next) : [...current, next]));
  }, []);
  const toggleDay = useCallback((id: WeekdayId) => {
    setDays((current) => {
      if (current.includes(id)) {
        const next = current.filter((item) => item !== id);
        return next.length ? next : current;
      }
      return [...current, id].sort((a, b) => a - b);
    });
  }, []);

  const pickAvatar = useCallback(async () => {
    const uri = await pickServiceImage({ square: true });
    if (uri) setAvatarUri(uri);
  }, []);

  const addOffer = useCallback(() => {
    if ((own?.offers.length ?? 0) >= limits.offers) {
      Alert.alert(t('common.limit'), t('me.offerLimit', { limit: limits.offers }));
      return;
    }
    router.push(offerEditorHref('new'));
  }, [limits.offers, own?.offers.length, router, t]);

  const addCustomKind = useCallback(() => {
    const name = customKindDraft.trim();
    if (!name) return;
    if (customKinds.some((item) => item.toLowerCase() === name.toLowerCase())) {
      Alert.alert(t('common.missing'), t('me.kindExists'));
      return;
    }
    if (customKinds.length >= CUSTOM_KINDS_LIMIT) {
      Alert.alert(t('common.limit'), t('me.kindLimit', { limit: CUSTOM_KINDS_LIMIT }));
      return;
    }
    setCustomKinds((current) => [...current, name]);
    setCustomKindDraft('');
  }, [customKindDraft, customKinds, t]);

  const removeCustomKind = useCallback((id: string | number) => {
    setCustomKinds((current) => current.filter((item) => item !== String(id)));
  }, []);

  const openOffer = useCallback((id: string) => router.push(offerEditorHref(id)), [router]);

  const onSave = useCallback(() => {
    const name = displayName.trim();
    if (!name) {
      Alert.alert(t('common.missing'), t('me.needName'));
      return;
    }
    dispatch(
      saveProfile({
        ...(own ?? emptyProfile()),
        displayName: name,
        bio: bio.trim(),
        email: email.trim(),
        phone: phone.trim(),
        address: address.trim() || undefined,
        avatarUri,
        photos: avatarUri ? [avatarUri] : [],
        kinds,
        customKinds,
        hours: { open, close, days },
        updatedAt: new Date().toISOString(),
      }),
    );
    router.replace(masterHref(own?.id ?? OWN_PROFILE_ID));
  }, [address, avatarUri, bio, close, customKinds, days, dispatch, displayName, email, kinds, open, own, phone, router, t]);

  return (
    <KeyboardAvoidingView style={formStyles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={formStyles.content} keyboardShouldPersistTaps="handled">
        <Text style={formStyles.lead}>{t('me.lead')}</Text>
        <Pressable onPress={pickAvatar} style={styles.avatarWrap}>
          <ServiceAvatar uri={avatarUri} name={displayName || t('common.you')} size={88} />
          <Text style={styles.avatarHint}>{t('me.avatar')}</Text>
        </Pressable>
        <FormField label={t('me.name')} value={displayName} onChangeText={setDisplayName} placeholder={t('me.namePh')} />
        <FormField
          label={t('me.bio')}
          value={bio}
          onChangeText={setBio}
          placeholder={t('me.bioPh')}
          multiline
        />
        <FormField
          label={t('me.email')}
          value={email}
          onChangeText={setEmail}
          placeholder="you@mail.com"
          keyboardType="email-address"
        />
        <FormField label={t('me.phone')} value={phone} onChangeText={setPhone} placeholder={t('me.phonePh')} keyboardType="phone-pad" />
        <FormField label={t('me.address')} value={address} onChangeText={setAddress} placeholder={t('me.addressPh')} />
        <Text style={formStyles.label}>{t('me.kinds')}</Text>
        <ChipWrap>
          {SERVICE_KINDS.map((item) => (
            <SelectChip
              key={item.id}
              id={item.id}
              label={t(keyOf('kind', item.id))}
              compact
              selected={kinds.includes(item.id)}
              onChange={toggleKind}
            />
          ))}
        </ChipWrap>
        <FormField
          label={t('me.customKinds')}
          value={customKindDraft}
          onChangeText={setCustomKindDraft}
          placeholder={t('me.customKindPh')}
        />
        <Pressable onPress={addCustomKind} hitSlop={8}>
          <Text style={styles.link}>{t('me.addKind')}</Text>
        </Pressable>
        {customKinds.length ? (
          <ChipWrap>
            {customKinds.map((item) => (
              <SelectChip key={item} id={item} label={item} compact selected onChange={removeCustomKind} />
            ))}
          </ChipWrap>
        ) : null}
        <Text style={formStyles.label}>{t('me.days')}</Text>
        <WeekdayStrip value={days} onToggle={toggleDay} />
        <Text style={formStyles.hint}>{t('me.daysHint')}</Text>
        <View style={styles.timeRow}>
          <View style={styles.timeCol}>
            <Text style={formStyles.label}>{t('me.open')}</Text>
            <TimeWheel value={open} onChange={setOpen} />
          </View>
          <View style={styles.timeCol}>
            <Text style={formStyles.label}>{t('me.close')}</Text>
            <TimeWheel value={close} onChange={setClose} />
          </View>
        </View>
        {hoursLabel ? <Text style={styles.hoursPreview}>{t('me.hoursPreview', { value: hoursLabel })}</Text> : null}
        <Pressable onPress={onSave} style={({ pressed }) => [formStyles.primary, pressed && formStyles.pressed]}>
          <Text style={formStyles.primaryText}>{t('me.save')}</Text>
        </Pressable>

        {own?.displayName ? (
          <>
            <View style={styles.rowBetween}>
              <Text style={styles.section}>{t('me.offers')}</Text>
              <Pressable onPress={addOffer} hitSlop={8}>
                <Text style={styles.link}>{t('me.add')}</Text>
              </Pressable>
            </View>
            {own.offers.length ? (
              own.offers.map((item) => (
                <OwnOfferRow
                  key={item.id}
                  id={item.id}
                  title={item.title}
                  price={offerPriceLabel(item, t('services.priceNegotiable'))}
                  onPress={openOffer}
                />
              ))
            ) : (
              <Text style={styles.empty}>{t('me.emptyOffers')}</Text>
            )}
          </>
        ) : null}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const OwnOfferRow = memo(function OwnOfferRow({
  id,
  title,
  price,
  onPress,
}: {
  id: string;
  title: string;
  price: string;
  onPress: (id: string) => void;
}) {
  const formStyles = useFormStyles();
  const styles = useThemedStyles(serviceMeStyles);
  const press = useCallback(() => onPress(id), [id, onPress]);
  return (
    <Pressable onPress={press} style={({ pressed }) => [styles.offerRow, pressed && formStyles.pressed]}>
      <View style={styles.offerBody}>
        <Text style={styles.offerTitle}>{title}</Text>
        <Text style={styles.offerMeta}>{price}</Text>
      </View>
      <Text style={styles.chevron}>›</Text>
    </Pressable>
  );
});

function serviceMeStyles(colors: ThemeColors, _scheme: ColorSchemeName) {
  return {
    avatarWrap: { alignItems: 'center' as const, gap: 8, marginVertical: 4 },
    avatarHint: { color: colors.accent, fontFamily: fonts.semibold, fontSize: 13 },
    hoursPreview: { color: colors.faint, fontFamily: fonts.medium, fontSize: 13 },
    timeRow: { flexDirection: 'row' as const, gap: 10 },
    timeCol: { flex: 1, minWidth: 0 },
    rowBetween: { flexDirection: 'row' as const, alignItems: 'center' as const, justifyContent: 'space-between' as const, marginTop: 12 },
    section: { color: colors.muted, fontFamily: fonts.semibold, fontSize: 12, textTransform: 'uppercase' as const },
    link: { color: colors.accent, fontFamily: fonts.semibold, fontSize: 14 },
    offerRow: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.cardBorder,
      borderRadius: radius.lg,
      paddingHorizontal: 14,
      paddingVertical: 12,
    },
    offerBody: { flex: 1, minWidth: 0 },
    offerTitle: { color: colors.text, fontFamily: fonts.semibold, fontSize: 15 },
    offerMeta: { color: colors.faint, fontFamily: fonts.medium, fontSize: 12, marginTop: 2 },
    chevron: { color: colors.faint, fontSize: 22 },
    empty: { color: colors.faint, fontFamily: fonts.medium, fontSize: 13 },
  };
}

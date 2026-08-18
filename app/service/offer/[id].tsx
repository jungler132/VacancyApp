import { useCallback, useMemo, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, View } from 'react-native';
import { Switch } from 'react-native-paper';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { ChipWrap } from '@/components/ChipWrap';
import { SelectChip } from '@/components/FilterChips';
import { FormField, useFormStyles } from '@/components/FormField';
import { ServicePhotoGrid } from '@/components/ServicePhotoGrid';
import { Text } from '@/components/AppText';
import { keyOf } from '@/lib/i18n';
import { useT } from '@/lib/i18n/useT';
import { SERVICE_ME_HREF } from '@/lib/services/catalog';
import { pickServiceImage } from '@/lib/services/images';
import { isServiceKindId, SERVICE_KINDS } from '@/lib/services/kinds';
import type { ServiceKindId } from '@/lib/services/types';
import {
  OFFERS_LIMIT,
  OFFER_PHOTOS_LIMIT,
  makeOfferId,
  OWN_PROFILE_ID,
  removeOffer,
  upsertOffer,
} from '@/lib/store/freelanceSlice';
import { useAppDispatch, useAppSelector } from '@/lib/store/hooks';
import { openPaywall } from '@/lib/store/premiumSlice';
import { fonts, useThemedStyles, type ColorSchemeName, type ThemeColors } from '@/lib/theme';
import { SALARY_CURRENCIES } from '@/lib/format';

export default function ServiceOfferEditor() {
  const ready = useAppSelector((state) => state.freelance.ready);
  const formStyles = useFormStyles();
  if (!ready) return <View style={formStyles.screen} />;
  return <OfferForm />;
}

function OfferForm() {
  const t = useT();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const formStyles = useFormStyles();
  const styles = useThemedStyles(offerEditorStyles);
  const { id } = useLocalSearchParams<{ id: string | string[] }>();
  const offerId = Array.isArray(id) ? id[0] : String(id ?? 'new');
  const isNew = offerId === 'new';
  const offers = useAppSelector((state) => state.freelance.offers);
  const profile = useAppSelector((state) => state.freelance.profile);
  const isPremium = useAppSelector((state) => state.premium.isPremium);
  const existing = useMemo(
    () => (isNew ? undefined : offers.find((item) => item.id === offerId)),
    [isNew, offerId, offers],
  );

  const [title, setTitle] = useState(existing?.title ?? '');
  const [description, setDescription] = useState(existing?.description ?? '');
  const [price, setPrice] = useState(existing?.price ?? '');
  const [currency, setCurrency] = useState(existing?.currency ?? 'RUB');
  const [kind, setKind] = useState<ServiceKindId>(existing?.kind ?? profile?.kinds[0] ?? 'other');
  const [customKind, setCustomKind] = useState(existing?.customKind ?? '');
  const [featured, setFeatured] = useState(Boolean(existing?.featured));
  const [address, setAddress] = useState(existing?.address ?? '');
  const [phone, setPhone] = useState(existing?.phone ?? '');
  const [images, setImages] = useState<string[]>(existing?.images ?? []);

  const onKind = useCallback((next: string | number) => {
    if (isServiceKindId(next)) setKind(next);
  }, []);
  const onCustomKindChip = useCallback((next: string | number) => {
    const name = String(next);
    if (customKind === name) {
      setCustomKind('');
      return;
    }
    setCustomKind(name);
    setKind('other');
  }, [customKind]);
  const onFeatured = useCallback(
    (next: boolean) => {
      if (next && !isPremium) {
        Alert.alert(t('common.premium'), t('offer.featuredNeedPremium'));
        dispatch(openPaywall());
        return;
      }
      setFeatured(next);
    },
    [dispatch, isPremium, t],
  );
  const onCurrency = useCallback((next: string | number) => setCurrency(String(next)), []);

  const addPhoto = useCallback(async () => {
    if (images.length >= OFFER_PHOTOS_LIMIT) {
      Alert.alert(t('common.limit'), t('offer.photoLimit', { limit: OFFER_PHOTOS_LIMIT }));
      return;
    }
    const uri = await pickServiceImage();
    if (uri) setImages((current) => [...current, uri].slice(0, OFFER_PHOTOS_LIMIT));
  }, [images.length, t]);

  const removePhoto = useCallback((uri: string) => {
    setImages((current) => current.filter((item) => item !== uri));
  }, []);

  const onSave = useCallback(() => {
    const nextTitle = title.trim();
    if (!nextTitle) {
      Alert.alert(t('common.missing'), t('offer.needTitle'));
      return;
    }
    if (!profile?.displayName) {
      Alert.alert(t('offer.needProfileTitle'), t('offer.needProfile'));
      router.replace(SERVICE_ME_HREF);
      return;
    }
    if (isNew && offers.length >= OFFERS_LIMIT) {
      Alert.alert(t('common.limit'), t('me.offerLimit', { limit: OFFERS_LIMIT }));
      return;
    }
    dispatch(
      upsertOffer({
        id: existing?.id ?? makeOfferId(),
        profileId: OWN_PROFILE_ID,
        title: nextTitle,
        description: description.trim(),
        price: price.trim() || undefined,
        currency,
        images,
        address: address.trim() || undefined,
        phone: phone.trim() || undefined,
        kind,
        customKind: customKind.trim() || undefined,
        featured: featured && isPremium,
        updatedAt: new Date().toISOString(),
      }),
    );
    router.back();
  }, [address, currency, customKind, description, dispatch, existing?.id, featured, images, isNew, isPremium, kind, offers.length, phone, price, profile?.displayName, router, t, title]);

  const onDelete = useCallback(() => {
    if (!existing) return;
    Alert.alert(t('offer.deleteTitle'), existing.title, [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: () => {
          dispatch(removeOffer(existing.id));
          router.back();
        },
      },
    ]);
  }, [dispatch, existing, router, t]);

  if (!isNew && !existing) {
    return (
      <View style={formStyles.center}>
        <Text style={formStyles.lead}>{t('offer.foreign')}</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={formStyles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={formStyles.content} keyboardShouldPersistTaps="handled">
        <Text style={formStyles.lead}>{t('offer.lead')}</Text>
        <FormField label={t('offer.title')} value={title} onChangeText={setTitle} placeholder={t('offer.titlePh')} />
        <Text style={formStyles.label}>{t('offer.kind')}</Text>
        <ChipWrap>
          {SERVICE_KINDS.map((item) => (
            <SelectChip
              key={item.id}
              id={item.id}
              label={t(keyOf('kind', item.id))}
              compact
              selected={kind === item.id}
              onChange={onKind}
            />
          ))}
        </ChipWrap>
        {profile?.customKinds.length ? (
          <>
            <Text style={formStyles.label}>{t('me.customKinds')}</Text>
            <ChipWrap>
              {profile.customKinds.map((item) => (
                <SelectChip
                  key={item}
                  id={item}
                  label={item}
                  compact
                  selected={customKind.trim() === item}
                  onChange={onCustomKindChip}
                />
              ))}
            </ChipWrap>
          </>
        ) : null}
        <FormField
          label={t('offer.customKind')}
          value={customKind}
          onChangeText={setCustomKind}
          placeholder={t('offer.customKindPh')}
        />
        <View style={styles.featureRow}>
          <View style={styles.featureBody}>
            <Text style={styles.featureTitle}>{t('offer.featured')}</Text>
            <Text style={styles.featureMeta}>
              {isPremium ? t('offer.featuredOn') : t('offer.featuredNeedPremium')}
            </Text>
          </View>
          <Switch value={featured && isPremium} onValueChange={onFeatured} />
        </View>
        <FormField
          label={t('offer.description')}
          value={description}
          onChangeText={setDescription}
          placeholder={t('offer.descriptionPh')}
          multiline
        />
        <FormField label={t('offer.price')} value={price} onChangeText={setPrice} placeholder="2500" keyboardType="numeric" />
        <Text style={formStyles.label}>{t('offer.currency')}</Text>
        <ChipWrap>
          {SALARY_CURRENCIES.map((item) => (
            <SelectChip key={item.id} id={item.id} label={item.id} compact selected={currency === item.id} onChange={onCurrency} />
          ))}
        </ChipWrap>
        <Text style={formStyles.label}>{t('offer.photos')}</Text>
        <ServicePhotoGrid
          uris={images}
          canAdd={images.length < OFFER_PHOTOS_LIMIT}
          onAdd={addPhoto}
          onRemove={removePhoto}
        />
        <Text style={formStyles.hint}>{t('offer.photoHint')}</Text>
        <FormField label={t('offer.address')} value={address} onChangeText={setAddress} placeholder={profile?.address || t('offer.asProfile')} />
        <FormField
          label={t('offer.phone')}
          value={phone}
          onChangeText={setPhone}
          placeholder={profile?.phone || t('offer.asProfile')}
          keyboardType="phone-pad"
        />
        <Pressable onPress={onSave} style={({ pressed }) => [formStyles.primary, pressed && formStyles.pressed]}>
          <Text style={formStyles.primaryText}>{isNew ? t('offer.add') : t('common.save')}</Text>
        </Pressable>
        {existing ? (
          <Pressable onPress={onDelete} style={({ pressed }) => [styles.danger, pressed && formStyles.pressed]}>
            <Text style={styles.dangerText}>{t('common.delete')}</Text>
          </Pressable>
        ) : null}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function offerEditorStyles(colors: ThemeColors, _scheme: ColorSchemeName) {
  return {
    featureRow: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 12, paddingVertical: 4 },
    featureBody: { flex: 1, minWidth: 0 },
    featureTitle: { color: colors.text, fontFamily: fonts.semibold, fontSize: 15 },
    featureMeta: { color: colors.faint, fontFamily: fonts.medium, fontSize: 12, marginTop: 2 },
    danger: { height: 48, alignItems: 'center' as const, justifyContent: 'center' as const },
    dangerText: { color: colors.danger, fontFamily: fonts.semibold, fontSize: 16 },
  };
}

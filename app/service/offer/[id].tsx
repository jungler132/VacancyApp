import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Switch } from 'react-native-paper';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { ChipWrap } from '@/components/ChipWrap';
import { SelectChip } from '@/components/FilterChips';
import { PlacePicker } from '@/components/PlacePicker';
import { FormField, useFormStyles } from '@/components/FormField';
import { FormScroll } from '@/components/FormScroll';
import { ServicePhotoGrid } from '@/components/ServicePhotoGrid';
import { runWithOverlay } from '@/components/SyncOverlay';
import { Text } from '@/components/AppText';
import { showAppConfirm, showAppNotice } from '@/lib/appNotice';
import { flushAccount } from '@/lib/backend/sync';
import { keyOf } from '@/lib/i18n';
import { useT } from '@/lib/i18n/useT';
import { prefillOfferContact, SERVICE_ME_HREF } from '@/lib/services/catalog';
import { pickServiceImage } from '@/lib/services/images';
import { isServiceKindId, SERVICE_KINDS } from '@/lib/services/kinds';
import type { ServiceKindId } from '@/lib/services/types';
import { useLimits } from '@/lib/hooks/useLimits';
import {
  makeOfferId,
  OWN_PROFILE_ID,
  removeOffer,
  upsertOffer,
} from '@/lib/store/freelanceSlice';
import { useAppDispatch, useAppSelector, useAppStore } from '@/lib/store/hooks';
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
  const store = useAppStore();
  const formStyles = useFormStyles();
  const styles = useThemedStyles(offerEditorStyles);
  const { id } = useLocalSearchParams<{ id: string | string[] }>();
  const offerId = Array.isArray(id) ? id[0] : String(id ?? 'new');
  const isNew = offerId === 'new';
  const offers = useAppSelector((state) => state.freelance.offers);
  const profile = useAppSelector((state) => state.freelance.profile);
  const isPremium = useAppSelector((state) => state.premium.isPremium);
  const limits = useLimits();
  const existing = useMemo(
    () => (isNew ? undefined : offers.find((item) => item.id === offerId)),
    [isNew, offerId, offers],
  );

  const contact = useMemo(() => prefillOfferContact(existing, profile), [existing, profile]);
  const [title, setTitle] = useState(existing?.title ?? '');
  const [description, setDescription] = useState(existing?.description ?? '');
  const [price, setPrice] = useState(existing?.price ?? '');
  const [negotiable, setNegotiable] = useState(Boolean(existing) && !existing?.price);
  const insets = useSafeAreaInsets();
  const [currency, setCurrency] = useState(existing?.currency ?? 'RUB');
  const [kind, setKind] = useState<ServiceKindId>(existing?.kind ?? profile?.kinds[0] ?? 'other');
  const [customKind, setCustomKind] = useState(existing?.customKind ?? profile?.customKinds?.[0] ?? '');
  const [featured, setFeatured] = useState(Boolean(existing?.featured));
  const [cityId, setCityId] = useState(contact.cityId);
  const [address, setAddress] = useState(contact.address);
  const [phone, setPhone] = useState(contact.phone);

  const [images, setImages] = useState<string[]>(existing?.images ?? []);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const next = existing?.cityId || profile?.cityId;
    if (!next) return;
    setCityId((current) => current || next);
  }, [existing?.cityId, profile?.cityId]);

  const onKind = useCallback((next: string | number) => {
    if (!isServiceKindId(next)) return;
    setKind(next);
    if (next !== 'other') setCustomKind('');
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
        dispatch(openPaywall());
        return;
      }
      setFeatured(next);
    },
    [dispatch, isPremium],
  );
  const onCurrency = useCallback((next: string | number) => setCurrency(String(next)), []);
  const onNegotiable = useCallback((next: boolean) => {
    setNegotiable(next);
    if (next) setPrice('');
  }, []);

  const addPhoto = useCallback(async () => {
    if (images.length >= limits.offerPhotos) {
      showAppNotice(t('common.limit'), t('offer.photoLimit', { limit: limits.offerPhotos }));
      return;
    }
    const uri = await pickServiceImage();
    if (uri) setImages((current) => [...current, uri].slice(0, limits.offerPhotos));
  }, [images.length, limits.offerPhotos, t]);

  const removePhoto = useCallback((uri: string) => {
    setImages((current) => current.filter((item) => item !== uri));
  }, []);

  const onSave = useCallback(async () => {
    const nextTitle = title.trim();
    if (!nextTitle) {
      showAppNotice(t('common.missing'), t('offer.needTitle'));
      return;
    }
    if (!description.trim()) {
      showAppNotice(t('common.missing'), t('offer.needDescription'));
      return;
    }
    if (!negotiable && !price.trim()) {
      showAppNotice(t('common.missing'), t('offer.needPrice'));
      return;
    }
    if (images.length < 1) {
      showAppNotice(t('common.missing'), t('offer.needPhoto'));
      return;
    }
    if (!profile?.displayName) {
      showAppNotice(t('offer.needProfileTitle'), t('offer.needProfile'));
      router.replace(SERVICE_ME_HREF);
      return;
    }
    if (isNew && offers.length >= limits.offers) {
      showAppNotice(t('common.limit'), t('me.offerLimit', { limit: limits.offers }));
      return;
    }
    if (saving) return;
    setSaving(true);
    try {
      await runWithOverlay(t('offer.saving'), async () => {
        dispatch(
          upsertOffer({
            id: existing?.id ?? makeOfferId(),
            profileId: OWN_PROFILE_ID,
            title: nextTitle,
            description: description.trim(),
            price: negotiable ? undefined : price.trim() || undefined,
            currency,
            images,
            address: address.trim() || undefined,
            cityId: cityId || undefined,
            phone: phone.trim() || undefined,
            kind,
            customKind: customKind.trim() || profile?.customKinds?.[0] || undefined,
            featured: featured && isPremium,
            archived: existing?.archived,
            updatedAt: new Date().toISOString(),
          }),
        );
        try {
          await flushAccount(() => store.getState(), dispatch);
        } catch {
          showAppNotice(t('common.missing'), t('auth.syncFailed'));
          return;
        }
        router.back();
      });
    } finally {
      setSaving(false);
    }
  }, [address, cityId, currency, customKind, description, dispatch, existing?.archived, existing?.id, featured, images, isNew, isPremium, kind, limits.offers, negotiable, offers.length, phone, price, profile?.customKinds, profile?.displayName, router, saving, store, t, title]);

  const onDelete = useCallback(() => {
    if (!existing) return;
    showAppConfirm({
      title: t('offer.deleteTitle'),
      body: existing.title,
      confirmLabel: t('common.delete'),
      danger: true,
      onConfirm: () => {
        dispatch(removeOffer(existing.id));
        router.back();
      },
    });
  }, [dispatch, existing, router, t]);

  if (!isNew && !existing) {
    return (
      <View style={formStyles.center}>
        <Text style={formStyles.lead}>{t('offer.foreign')}</Text>
      </View>
    );
  }

  return (
    <View style={formStyles.screen}>
      <FormScroll contentContainerStyle={[formStyles.content, { paddingBottom: Math.max(insets.bottom, 16) + 72 }]}>
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
            <Text style={styles.featureMeta} numberOfLines={3}>
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
        <View style={styles.featureRow}>
          <View style={styles.featureBody}>
            <Text style={styles.featureTitle}>{t('offer.negotiable')}</Text>
            <Text style={styles.featureMeta}>{t('offer.negotiableHint')}</Text>
          </View>
          <Switch value={negotiable} onValueChange={onNegotiable} />
        </View>
        {negotiable ? null : (
          <>
            <FormField label={t('offer.price')} value={price} onChangeText={setPrice} placeholder="2500" keyboardType="numeric" />
            <Text style={formStyles.label}>{t('offer.currency')}</Text>
            <ChipWrap>
              {SALARY_CURRENCIES.map((item) => (
                <SelectChip key={item.id} id={item.id} label={item.id} compact selected={currency === item.id} onChange={onCurrency} />
              ))}
            </ChipWrap>
          </>
        )}
        <Text style={formStyles.label}>{t('offer.photos')}</Text>
        <ServicePhotoGrid
          uris={images}
          canAdd={images.length < limits.offerPhotos}
          onAdd={addPhoto}
          onRemove={removePhoto}
        />
        <Text style={formStyles.hint}>{t('offer.photoHint')}</Text>
        <PlacePicker label={t('offer.city')} value={cityId} onChange={setCityId} />
        <FormField label={t('offer.address')} value={address} onChangeText={setAddress} placeholder={t('offer.asProfile')} />
        <FormField
          label={t('offer.phone')}
          value={phone}
          onChangeText={setPhone}
          placeholder={t('offer.asProfile')}
          keyboardType="phone-pad"
        />
        <Pressable
          onPress={onSave}
          disabled={saving}
          style={({ pressed }) => [formStyles.primary, (pressed || saving) && formStyles.pressed]}>
          <Text style={formStyles.primaryText}>{isNew ? t('offer.add') : t('common.save')}</Text>
        </Pressable>
        {existing ? (
          <Pressable
            onPress={onDelete}
            disabled={saving}
            style={({ pressed }) => [styles.danger, pressed && formStyles.pressed]}>
            <Text style={styles.dangerText}>{t('common.delete')}</Text>
          </Pressable>
        ) : null}
      </FormScroll>
    </View>
  );
}

function offerEditorStyles(colors: ThemeColors, _scheme: ColorSchemeName) {
  return {
    featureRow: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 12, paddingVertical: 4 },
    featureBody: { flex: 1, minWidth: 0 },
    featureTitle: { color: colors.text, fontFamily: fonts.semibold, fontSize: 15 },
    featureMeta: { color: colors.faint, fontFamily: fonts.medium, fontSize: 12, lineHeight: 18, marginTop: 4 },
    danger: { height: 48, alignItems: 'center' as const, justifyContent: 'center' as const },
    dangerText: { color: colors.danger, fontFamily: fonts.semibold, fontSize: 16 },
  };
}

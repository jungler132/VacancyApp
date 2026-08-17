import { memo, useCallback, useMemo, useState } from 'react';
import { Alert, Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { SelectChip } from '@/components/FilterChips';
import { FormField, formStyles } from '@/components/FormField';
import { Text } from '@/components/AppText';
import { SERVICE_ME_HREF } from '@/lib/services/catalog';
import { pickServiceImage } from '@/lib/services/images';
import { SERVICE_KINDS } from '@/lib/services/kinds';
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
import { colors, fonts, radius } from '@/lib/theme';
import { SALARY_CURRENCIES } from '@/lib/format';

export default function ServiceOfferEditor() {
  const ready = useAppSelector((state) => state.freelance.ready);
  if (!ready) return <View style={formStyles.screen} />;
  return <OfferForm />;
}

function OfferForm() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { id } = useLocalSearchParams<{ id: string | string[] }>();
  const offerId = Array.isArray(id) ? id[0] : String(id ?? 'new');
  const isNew = offerId === 'new';
  const offers = useAppSelector((state) => state.freelance.offers);
  const profile = useAppSelector((state) => state.freelance.profile);
  const existing = useMemo(
    () => (isNew ? undefined : offers.find((item) => item.id === offerId)),
    [isNew, offerId, offers],
  );

  const [title, setTitle] = useState(existing?.title ?? '');
  const [description, setDescription] = useState(existing?.description ?? '');
  const [price, setPrice] = useState(existing?.price ?? '');
  const [currency, setCurrency] = useState(existing?.currency ?? 'RUB');
  const [kind, setKind] = useState<ServiceKindId>(existing?.kind ?? profile?.kinds[0] ?? 'other');
  const [address, setAddress] = useState(existing?.address ?? '');
  const [phone, setPhone] = useState(existing?.phone ?? '');
  const [images, setImages] = useState<string[]>(existing?.images ?? []);

  const onKind = useCallback((next: string | number) => setKind(next as ServiceKindId), []);
  const onCurrency = useCallback((next: string | number) => setCurrency(String(next)), []);

  const addPhoto = useCallback(async () => {
    if (images.length >= OFFER_PHOTOS_LIMIT) {
      Alert.alert('Лимит', `Не больше ${OFFER_PHOTOS_LIMIT} фото на услугу.`);
      return;
    }
    const uri = await pickServiceImage();
    if (uri) setImages((current) => [...current, uri].slice(0, OFFER_PHOTOS_LIMIT));
  }, [images.length]);

  const removePhoto = useCallback((uri: string) => {
    setImages((current) => current.filter((item) => item !== uri));
  }, []);

  const onSave = useCallback(() => {
    const nextTitle = title.trim();
    if (!nextTitle) {
      Alert.alert('Не хватает данных', 'Укажите название услуги.');
      return;
    }
    if (!profile?.displayName) {
      Alert.alert('Сначала профиль', 'Сохраните страницу мастера, потом добавляйте услуги.');
      router.replace(SERVICE_ME_HREF);
      return;
    }
    if (isNew && offers.length >= OFFERS_LIMIT) {
      Alert.alert('Лимит', `Не больше ${OFFERS_LIMIT} услуг на странице.`);
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
        updatedAt: new Date().toISOString(),
      }),
    );
    router.back();
  }, [address, currency, description, dispatch, existing?.id, images, isNew, kind, offers.length, phone, price, profile?.displayName, router, title]);

  const onDelete = useCallback(() => {
    if (!existing) return;
    Alert.alert('Удалить услугу?', existing.title, [
      { text: 'Отмена', style: 'cancel' },
      {
        text: 'Удалить',
        style: 'destructive',
        onPress: () => {
          dispatch(removeOffer(existing.id));
          router.back();
        },
      },
    ]);
  }, [dispatch, existing, router]);

  if (!isNew && !existing) {
    return (
      <View style={formStyles.center}>
        <Text style={formStyles.lead}>Эту услугу нельзя править здесь — откройте свою карточку из «Моя страница».</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={formStyles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={formStyles.content} keyboardShouldPersistTaps="handled">
        <Text style={formStyles.lead}>
          Карточка на вашей странице: описание, цена, фото, адрес и телефон если отличаются от профиля.
        </Text>
        <FormField label="Название" value={title} onChangeText={setTitle} placeholder="Маникюр с покрытием" />
        <Text style={formStyles.label}>Вид</Text>
        <View style={formStyles.wrap}>
          {SERVICE_KINDS.map((item) => (
            <SelectChip
              key={item.id}
              id={item.id}
              label={item.label}
              compact
              selected={kind === item.id}
              onChange={onKind}
            />
          ))}
        </View>
        <FormField
          label="Описание"
          value={description}
          onChangeText={setDescription}
          placeholder="Что входит, сколько длится, выезд или нет"
          multiline
        />
        <FormField label="Цена" value={price} onChangeText={setPrice} placeholder="2500" keyboardType="numeric" />
        <Text style={formStyles.label}>Валюта</Text>
        <View style={formStyles.wrap}>
          {SALARY_CURRENCIES.map((item) => (
            <SelectChip key={item.id} id={item.id} label={item.id} compact selected={currency === item.id} onChange={onCurrency} />
          ))}
        </View>
        <Text style={formStyles.label}>Фото</Text>
        <View style={styles.photos}>
          {images.map((uri) => (
            <PhotoThumb key={uri} uri={uri} onRemove={removePhoto} />
          ))}
          {images.length < OFFER_PHOTOS_LIMIT ? (
            <Pressable onPress={addPhoto} style={styles.addPhoto}>
              <Text style={styles.addPhotoText}>+</Text>
            </Pressable>
          ) : null}
        </View>
        <Text style={formStyles.hint}>Нажмите фото, чтобы убрать. Пустой адрес и телефон возьмутся из профиля.</Text>
        <FormField label="Адрес услуги" value={address} onChangeText={setAddress} placeholder={profile?.address || 'Как в профиле'} />
        <FormField
          label="Телефон услуги"
          value={phone}
          onChangeText={setPhone}
          placeholder={profile?.phone || 'Как в профиле'}
          keyboardType="phone-pad"
        />
        <Pressable onPress={onSave} style={({ pressed }) => [formStyles.primary, pressed && formStyles.pressed]}>
          <Text style={formStyles.primaryText}>{isNew ? 'Добавить услугу' : 'Сохранить'}</Text>
        </Pressable>
        {existing ? (
          <Pressable onPress={onDelete} style={({ pressed }) => [styles.danger, pressed && formStyles.pressed]}>
            <Text style={styles.dangerText}>Удалить</Text>
          </Pressable>
        ) : null}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const PhotoThumb = memo(function PhotoThumb({ uri, onRemove }: { uri: string; onRemove: (uri: string) => void }) {
  const press = useCallback(() => onRemove(uri), [onRemove, uri]);
  return (
    <Pressable onPress={press}>
      <Image source={{ uri }} style={styles.photo} />
    </Pressable>
  );
});

const styles = StyleSheet.create({
  photos: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  photo: { width: 72, height: 72, borderRadius: radius.md, backgroundColor: colors.chip },
  addPhoto: {
    width: 72,
    height: 72,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.chipBorder,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.card,
  },
  addPhotoText: { color: colors.accent, fontSize: 28, lineHeight: 32 },
  danger: { height: 48, alignItems: 'center', justifyContent: 'center' },
  dangerText: { color: colors.danger, fontFamily: fonts.semibold, fontSize: 16 },
});

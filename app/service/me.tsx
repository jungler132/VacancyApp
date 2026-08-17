import { memo, useCallback, useMemo, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';

import { SelectChip } from '@/components/FilterChips';
import { FormField, formStyles } from '@/components/FormField';
import { ServiceAvatar } from '@/components/ServiceAvatar';
import { Text } from '@/components/AppText';
import { masterHref, offerEditorHref, offerPriceLabel } from '@/lib/services/catalog';
import { pickServiceImage } from '@/lib/services/images';
import { HOUR_OPTIONS, SERVICE_KINDS, formatServiceHours } from '@/lib/services/kinds';
import type { ServiceKindId } from '@/lib/services/types';
import { OWN_PROFILE_ID, emptyProfile, OFFERS_LIMIT, saveProfile } from '@/lib/store/freelanceSlice';
import { useAppDispatch, useAppSelector } from '@/lib/store/hooks';
import { selectOwnMaster } from '@/lib/store/selectors';
import { colors, fonts, radius } from '@/lib/theme';

export default function ServiceProfileEditor() {
  const ready = useAppSelector((state) => state.freelance.ready);
  if (!ready) return <View style={formStyles.screen} />;
  return <ProfileForm />;
}

function ProfileForm() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const own = useAppSelector(selectOwnMaster);
  const seed = useMemo(() => own ?? emptyProfile(), [own]);
  const [displayName, setDisplayName] = useState(seed.displayName);
  const [bio, setBio] = useState(seed.bio);
  const [email, setEmail] = useState(seed.email);
  const [phone, setPhone] = useState(seed.phone);
  const [address, setAddress] = useState(seed.address ?? '');
  const [avatarUri, setAvatarUri] = useState(seed.avatarUri);
  const [kinds, setKinds] = useState<ServiceKindId[]>(seed.kinds);
  const [open, setOpen] = useState(seed.hours.open);
  const [close, setClose] = useState(seed.hours.close);
  const hoursLabel = useMemo(() => formatServiceHours(open, close), [close, open]);

  const toggleKind = useCallback((id: string | number) => {
    const next = id as ServiceKindId;
    setKinds((current) => (current.includes(next) ? current.filter((item) => item !== next) : [...current, next]));
  }, []);
  const onOpenHour = useCallback((id: string | number) => setOpen(String(id)), []);
  const onCloseHour = useCallback((id: string | number) => setClose(String(id)), []);

  const pickAvatar = useCallback(async () => {
    const uri = await pickServiceImage({ square: true });
    if (uri) setAvatarUri(uri);
  }, []);

  const addOffer = useCallback(() => {
    if ((own?.offers.length ?? 0) >= OFFERS_LIMIT) {
      Alert.alert('Лимит', `Не больше ${OFFERS_LIMIT} услуг на странице.`);
      return;
    }
    router.push(offerEditorHref('new'));
  }, [own?.offers.length, router]);

  const openOffer = useCallback((id: string) => router.push(offerEditorHref(id)), [router]);

  const onSave = useCallback(() => {
    const name = displayName.trim();
    if (!name) {
      Alert.alert('Не хватает данных', 'Укажите, как вас представлять.');
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
        kinds,
        hours: { open, close },
        updatedAt: new Date().toISOString(),
      }),
    );
    router.replace(masterHref(own?.id ?? OWN_PROFILE_ID));
  }, [address, avatarUri, bio, close, dispatch, displayName, email, kinds, open, own, phone, router]);

  return (
    <KeyboardAvoidingView style={formStyles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={formStyles.content} keyboardShouldPersistTaps="handled">
        <Text style={formStyles.lead}>
          Это витрина самозанятого. Пока хранится на устройстве, поля уже как у будущего API.
        </Text>
        <Pressable onPress={pickAvatar} style={styles.avatarWrap}>
          <ServiceAvatar uri={avatarUri} name={displayName || 'Вы'} size={88} />
          <Text style={styles.avatarHint}>Аватар из галереи</Text>
        </Pressable>
        <FormField label="Как вас зовут" value={displayName} onChangeText={setDisplayName} placeholder="Анна Крылова" />
        <FormField
          label="Кто вы и что делаете"
          value={bio}
          onChangeText={setBio}
          placeholder="Мастер маникюра, выезд по району"
          multiline
        />
        <FormField
          label="Почта"
          value={email}
          onChangeText={setEmail}
          placeholder="you@mail.com"
          keyboardType="email-address"
        />
        <FormField label="Телефон" value={phone} onChangeText={setPhone} placeholder="+7 900 000 00 00" keyboardType="phone-pad" />
        <FormField label="Адрес или район" value={address} onChangeText={setAddress} placeholder="Москва, Сокол" />
        <Text style={formStyles.label}>Виды услуг</Text>
        <View style={formStyles.wrap}>
          {SERVICE_KINDS.map((item) => (
            <SelectChip
              key={item.id}
              id={item.id}
              label={item.label}
              compact
              selected={kinds.includes(item.id)}
              onChange={toggleKind}
            />
          ))}
        </View>
        <Text style={formStyles.label}>Работаю с</Text>
        <View style={formStyles.wrap}>
          {HOUR_OPTIONS.map((item) => (
            <SelectChip key={`o-${item}`} id={item} label={item} compact selected={open === item} onChange={onOpenHour} />
          ))}
        </View>
        <Text style={formStyles.label}>До</Text>
        <View style={formStyles.wrap}>
          {HOUR_OPTIONS.map((item) => (
            <SelectChip key={`c-${item}`} id={item} label={item} compact selected={close === item} onChange={onCloseHour} />
          ))}
        </View>
        {hoursLabel ? <Text style={styles.hoursPreview}>На странице будет: {hoursLabel}</Text> : null}
        <Pressable onPress={onSave} style={({ pressed }) => [formStyles.primary, pressed && formStyles.pressed]}>
          <Text style={formStyles.primaryText}>Сохранить страницу</Text>
        </Pressable>

        {own?.displayName ? (
          <>
            <View style={styles.rowBetween}>
              <Text style={styles.section}>Услуги</Text>
              <Pressable onPress={addOffer} hitSlop={8}>
                <Text style={styles.link}>Добавить</Text>
              </Pressable>
            </View>
            {own.offers.length ? (
              own.offers.map((item) => (
                <OwnOfferRow
                  key={item.id}
                  id={item.id}
                  title={item.title}
                  price={offerPriceLabel(item)}
                  onPress={openOffer}
                />
              ))
            ) : (
              <Text style={styles.empty}>Добавьте первую услугу: описание, цена, фото.</Text>
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

const styles = StyleSheet.create({
  avatarWrap: { alignItems: 'center', gap: 8, marginVertical: 4 },
  avatarHint: { color: colors.accent, fontFamily: fonts.semibold, fontSize: 13 },
  hoursPreview: { color: colors.faint, fontFamily: fonts.medium, fontSize: 13 },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 },
  section: { color: colors.muted, fontFamily: fonts.semibold, fontSize: 12, textTransform: 'uppercase' },
  link: { color: colors.accent, fontFamily: fonts.semibold, fontSize: 14 },
  offerRow: {
    flexDirection: 'row',
    alignItems: 'center',
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
});

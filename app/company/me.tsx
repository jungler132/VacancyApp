import { useCallback, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';

import { FormField, useFormStyles } from '@/components/FormField';
import { ServiceAvatar } from '@/components/ServiceAvatar';
import { runWithOverlay } from '@/components/SyncOverlay';
import { Text } from '@/components/AppText';
import { flushAccount } from '@/lib/backend/sync';
import { useT } from '@/lib/i18n/useT';
import { pickServiceImage } from '@/lib/services/images';
import { saveCompany } from '@/lib/store/companySlice';
import { useAppDispatch, useAppSelector, useAppStore } from '@/lib/store/hooks';
import { fonts, useThemedStyles, type ColorSchemeName, type ThemeColors } from '@/lib/theme';

export default function CompanyPageEditor() {
  const ready = useAppSelector((state) => state.company.ready);
  const formStyles = useFormStyles();
  if (!ready) return <View style={formStyles.screen} />;
  return <CompanyForm />;
}

function CompanyForm() {
  const t = useT();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const store = useAppStore();
  const formStyles = useFormStyles();
  const styles = useThemedStyles(companyMeStyles);
  const company = useAppSelector((state) => state.company);
  const userId = useAppSelector((state) => state.auth.userId);
  const [name, setName] = useState(company.name);
  const [about, setAbout] = useState(company.about);
  const [logoUri, setLogoUri] = useState(company.logoUri);
  const [notice, setNotice] = useState('');
  const [saving, setSaving] = useState(false);

  const pickLogo = useCallback(async () => {
    const uri = await pickServiceImage({ square: true });
    if (uri) setLogoUri(uri);
  }, []);

  const onSave = useCallback(async () => {
    const next = name.trim();
    if (!next) {
      setNotice(t('company.needName'));
      return;
    }
    if (saving) return;
    setSaving(true);
    setNotice('');
    try {
      await runWithOverlay(t('company.saving'), async () => {
        dispatch(saveCompany({ name: next, about: about.trim(), logoUri }));
        await flushAccount(() => store.getState(), dispatch);
        router.back();
      });
    } finally {
      setSaving(false);
    }
  }, [about, dispatch, logoUri, name, router, saving, store, t]);

  return (
    <KeyboardAvoidingView style={formStyles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={formStyles.content} keyboardShouldPersistTaps="handled">
        <Text style={formStyles.lead}>{t(userId ? 'company.lead' : 'company.leadGuest')}</Text>
        <Pressable onPress={pickLogo} style={styles.avatarWrap}>
          <ServiceAvatar uri={logoUri} name={name || t('create.company')} size={88} />
          <Text style={styles.avatarHint}>{t('company.logo')}</Text>
        </Pressable>
        <FormField label={t('company.name')} value={name} onChangeText={setName} placeholder={t('company.namePh')} />
        <FormField
          label={t('company.about')}
          value={about}
          onChangeText={setAbout}
          placeholder={t('company.aboutPh')}
          multiline
        />
        {notice ? <Text style={styles.notice}>{notice}</Text> : null}
        <Pressable
          onPress={onSave}
          disabled={saving}
          style={({ pressed }) => [formStyles.primary, (pressed || saving) && formStyles.pressed]}>
          <Text style={formStyles.primaryText}>{t('company.save')}</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function companyMeStyles(colors: ThemeColors, _scheme: ColorSchemeName) {
  return {
    avatarWrap: { alignItems: 'center' as const, gap: 8, marginVertical: 4 },
    avatarHint: { color: colors.accent, fontFamily: fonts.semibold, fontSize: 13 },
    notice: { color: colors.danger, fontFamily: fonts.medium, fontSize: 13 },
  };
}

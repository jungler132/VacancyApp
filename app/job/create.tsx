import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';

import { ChipWrap } from '@/components/ChipWrap';
import { SelectChip } from '@/components/FilterChips';
import { FormField, useFormStyles } from '@/components/FormField';
import { Text } from '@/components/AppText';
import { CATEGORIES } from '@/lib/catalog';
import { SALARY_CURRENCIES } from '@/lib/format';
import { useT } from '@/lib/i18n/useT';
import { keyOf } from '@/lib/i18n';
import { useLimits } from '@/lib/hooks/useLimits';
import { buildLocalJob, upsertLocalJob } from '@/lib/store/localJobsSlice';
import { jobHref } from '@/lib/jobRoute';
import { pinViewedJob } from '@/lib/store/jobsSlice';
import { openPaywall } from '@/lib/store/premiumSlice';
import { useAppDispatch, useAppSelector } from '@/lib/store/hooks';
import type { CategoryId, JobTier } from '@/lib/types';
import { fonts, radius, useThemedStyles, type ColorSchemeName, type ThemeColors } from '@/lib/theme';

const FORM_CATEGORIES = CATEGORIES.filter((item) => item.id !== 'all');

export default function CreateJobScreen() {
  const t = useT();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const formStyles = useFormStyles();
  const styles = useThemedStyles(createJobStyles);
  const isPremium = useAppSelector((state) => state.premium.isPremium);
  const paywallOpen = useAppSelector((state) => state.premium.paywallOpen);
  const localCount = useAppSelector((state) => state.localJobs.items.length);
  const limits = useLimits();

  const [title, setTitle] = useState('');
  const [company, setCompany] = useState('');
  const [location, setLocation] = useState('');
  const [salary, setSalary] = useState('');
  const [currency, setCurrency] = useState('RUB');
  const [contact, setContact] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<CategoryId>('it');
  const [remote, setRemote] = useState(false);

  const pendingPremium = useRef(false);
  const formRef = useRef({ title, company, location, salary, currency, contact, description, category, remote });
  formRef.current = { title, company, location, salary, currency, contact, description, category, remote };

  const publish = useCallback(
    (tier: JobTier) => {
      const form = formRef.current;
      const nextTitle = form.title.trim();
      const nextCompany = form.company.trim();
      if (!nextTitle || !nextCompany) {
        Alert.alert(t('common.missing'), t('create.needTitle'));
        return;
      }
      if (localCount >= limits.jobs) {
        Alert.alert(t('common.limit'), t('create.limit', { limit: limits.jobs }));
        return;
      }
      const job = buildLocalJob({
        title: nextTitle,
        company: nextCompany,
        location: form.location,
        salary: form.salary,
        currency: form.currency,
        description: form.description,
        category: form.category,
        contact: form.contact,
        remote: form.remote,
        tier,
      });
      dispatch(upsertLocalJob(job));
      dispatch(pinViewedJob(job));
      router.replace(jobHref(job.id));
    },
    [dispatch, limits.jobs, localCount, router, t],
  );

  const onFree = useCallback(() => publish(2), [publish]);
  const onCurrency = useCallback((id: string | number) => setCurrency(String(id)), []);
  const onCategory = useCallback((id: string | number) => setCategory(id as CategoryId), []);
  const onOffice = useCallback(() => setRemote(false), []);
  const onRemote = useCallback(() => setRemote(true), []);

  const onPremium = useCallback(() => {
    if (isPremium) {
      publish(1);
      return;
    }
    pendingPremium.current = true;
    dispatch(openPaywall());
  }, [dispatch, isPremium, publish]);

  useEffect(() => {
    if (!pendingPremium.current) return;
    if (paywallOpen) return;
    if (!isPremium) {
      pendingPremium.current = false;
      return;
    }
    pendingPremium.current = false;
    publish(1);
  }, [isPremium, paywallOpen, publish]);

  return (
    <KeyboardAvoidingView style={formStyles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={formStyles.content} keyboardShouldPersistTaps="handled">
        <Text style={formStyles.lead}>{t('create.lead')}</Text>
        <FormField label={t('create.title')} value={title} onChangeText={setTitle} placeholder={t('create.titlePh')} />
        <FormField label={t('create.company')} value={company} onChangeText={setCompany} placeholder={t('create.companyPh')} />
        <FormField label={t('create.city')} value={location} onChangeText={setLocation} placeholder={t('create.cityPh')} />
        <FormField
          label={t('create.salary')}
          value={salary}
          onChangeText={setSalary}
          placeholder="150 000"
          keyboardType="numeric"
        />
        <Text style={formStyles.label}>{t('offer.currency')}</Text>
        <ChipWrap>
          {SALARY_CURRENCIES.map((item) => (
            <SelectChip
              key={item.id}
              id={item.id}
              label={`${item.label} ${item.id}`}
              compact
              selected={currency === item.id}
              onChange={onCurrency}
            />
          ))}
        </ChipWrap>
        <FormField label={t('create.contact')} value={contact} onChangeText={setContact} placeholder={t('create.contactPh')} />
        <Text style={formStyles.label}>{t('create.category')}</Text>
        <ChipWrap>
          {FORM_CATEGORIES.map((item) => (
            <SelectChip
              key={item.id}
              id={item.id}
              label={t(keyOf('category', item.id))}
              compact
              selected={category === item.id}
              onChange={onCategory}
            />
          ))}
        </ChipWrap>
        <ChipWrap>
          <SelectChip id="office" label={t('create.office')} compact selected={!remote} onChange={onOffice} />
          <SelectChip id="remote" label={t('create.remote')} compact selected={remote} onChange={onRemote} />
        </ChipWrap>
        <FormField
          label={t('create.description')}
          value={description}
          onChangeText={setDescription}
          placeholder={t('create.descriptionPh')}
          multiline
        />
        <Pressable onPress={onFree} style={({ pressed }) => [formStyles.primary, pressed && formStyles.pressed]}>
          <Text style={formStyles.primaryText}>{t('create.publish')}</Text>
        </Pressable>
        <Pressable onPress={onPremium} style={({ pressed }) => [styles.premium, pressed && formStyles.pressed]}>
          <Text style={styles.premiumText}>{t('create.premium')}</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function createJobStyles(colors: ThemeColors, _scheme: ColorSchemeName) {
  return {
    premium: {
      height: 48,
      borderRadius: radius.full,
      borderWidth: 1,
      borderColor: colors.accent,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
    },
    premiumText: { color: colors.accent, fontFamily: fonts.semibold, fontSize: 16 },
  };
}

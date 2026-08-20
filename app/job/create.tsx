import { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';

import { ChipWrap } from '@/components/ChipWrap';
import { CompanyLogo } from '@/components/CompanyLogo';
import { SelectChip } from '@/components/FilterChips';
import { FormField, useFormStyles } from '@/components/FormField';
import { FormScroll } from '@/components/FormScroll';
import { Text } from '@/components/AppText';
import { CATEGORIES } from '@/lib/catalog';
import { SALARY_CURRENCIES } from '@/lib/format';
import { keyOf } from '@/lib/i18n';
import { PlacePicker } from '@/components/PlacePicker';
import { useLocale, useT } from '@/lib/i18n/useT';
import { placeLabel } from '@/lib/places';
import { useLimits } from '@/lib/hooks/useLimits';
import { COMPANY_ME_HREF } from '@/lib/services/catalog';
import { pickServiceImage } from '@/lib/services/images';
import { flushAccount } from '@/lib/backend/sync';
import { saveCompany } from '@/lib/store/companySlice';
import { buildLocalJob, upsertLocalJob } from '@/lib/store/localJobsSlice';
import { jobHref } from '@/lib/jobRoute';
import { pinViewedJob } from '@/lib/store/jobsSlice';
import { openPaywall } from '@/lib/store/premiumSlice';
import { useAppDispatch, useAppSelector, useAppStore } from '@/lib/store/hooks';
import type { CategoryId, JobTier } from '@/lib/types';
import { fonts, radius, useThemedStyles, type ColorSchemeName, type ThemeColors } from '@/lib/theme';
import { ToneCard } from '@/components/ToneCard';

const FORM_CATEGORIES = CATEGORIES.filter((item) => item.id !== 'all');
const EMPLOYMENTS = ['full', 'part', 'shift'] as const;
const EXPERIENCE = ['none', 'y1', 'y3', 'y6'] as const;
const SCHEDULES = ['fullday', 'shift', 'flex', 'rotation'] as const;

export default function CreateJobScreen() {
  const t = useT();
  const locale = useLocale();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const store = useAppStore();
  const formStyles = useFormStyles();
  const styles = useThemedStyles(createJobStyles);
  const isPremium = useAppSelector((state) => state.premium.isPremium);
  const paywallOpen = useAppSelector((state) => state.premium.paywallOpen);
  const localCount = useAppSelector((state) => state.localJobs.items.length);
  const company = useAppSelector((state) => state.company);
  const profilePhone = useAppSelector((state) => state.freelance.profile?.phone ?? '');
  const limits = useLimits();

  const [title, setTitle] = useState('');
  const [companyName, setCompanyName] = useState(company.name);
  const [logoUri, setLogoUri] = useState(company.logoUri);
  const [cityId, setCityId] = useState('');
  const [salary, setSalary] = useState('');
  const [currency, setCurrency] = useState('RUB');
  const [contact, setContact] = useState(profilePhone);
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<CategoryId>('it');
  const [remote, setRemote] = useState(false);
  const [employment, setEmployment] = useState('');
  const [experience, setExperience] = useState('');
  const [schedule, setSchedule] = useState('');
  const [notice, setNotice] = useState('');

  const pendingPremium = useRef(false);
  const formRef = useRef({
    title,
    companyName,
    logoUri,
    cityId,
    salary,
    currency,
    contact,
    description,
    category,
    remote,
    employment,
    experience,
    schedule,
  });
  formRef.current = {
    title,
    companyName,
    logoUri,
    cityId,
    salary,
    currency,
    contact,
    description,
    category,
    remote,
    employment,
    experience,
    schedule,
  };

  useEffect(() => {
    if (company.name && !companyName) setCompanyName(company.name);
    if (company.logoUri && !logoUri) setLogoUri(company.logoUri);
  }, [company.logoUri, company.name, companyName, logoUri]);

  const pickLogo = useCallback(async () => {
    const uri = await pickServiceImage({ square: true });
    if (uri) setLogoUri(uri);
  }, []);

  const publish = useCallback(
    async (tier: JobTier) => {
      const form = formRef.current;
      const nextTitle = form.title.trim();
      const nextCompany = form.companyName.trim();
      if (!nextTitle || !nextCompany) {
        setNotice(t('create.needTitle'));
        return;
      }
      if (!form.remote && !form.cityId) {
        setNotice(t('create.needCity'));
        return;
      }
      if (localCount >= limits.jobs) {
        setNotice(t('create.limit', { limit: limits.jobs }));
        return;
      }
      setNotice('');
      dispatch(
        saveCompany({
          name: nextCompany,
          about: store.getState().company.about,
          logoUri: form.logoUri,
        }),
      );
      const job = buildLocalJob({
        title: nextTitle,
        company: nextCompany,
        companyLogo: form.logoUri,
        location: placeLabel(form.cityId, locale),
        cityId: form.cityId || undefined,
        salary: form.salary,
        currency: form.currency,
        description: form.description,
        category: form.category,
        contact: form.contact,
        remote: form.remote,
        employment: form.employment || undefined,
        experience: form.experience || undefined,
        schedule: form.schedule || undefined,
        tier,
      });
      dispatch(upsertLocalJob(job));
      dispatch(pinViewedJob(job));
      await flushAccount(() => store.getState(), dispatch);
      router.replace(jobHref(job.id));
    },
    [dispatch, limits.jobs, locale, localCount, router, store, t],
  );

  const onFree = useCallback(() => {
    void publish(2);
  }, [publish]);
  const onCurrency = useCallback((id: string | number) => setCurrency(String(id)), []);
  const onCategory = useCallback((id: string | number) => setCategory(id as CategoryId), []);
  const onOffice = useCallback(() => setRemote(false), []);
  const onRemote = useCallback(() => setRemote(true), []);
  const toggleChip = useCallback((current: string, set: (value: string) => void) => {
    return (id: string | number) => {
      const next = String(id);
      set(current === next ? '' : next);
    };
  }, []);

  const onPremium = useCallback(() => {
    if (isPremium) {
      void publish(1);
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
    void publish(1);
  }, [isPremium, paywallOpen, publish]);

  const previewTitle = title.trim() || t('create.titlePh');
  const previewCompany = companyName.trim() || t('create.companyPh');

  return (
    <View style={formStyles.screen}>
      <FormScroll contentContainerStyle={formStyles.content}>
        <Text style={formStyles.lead}>{t('create.lead')}</Text>
        <Text style={formStyles.label}>{t('create.preview')}</Text>
        <ToneCard tone="app" style={styles.preview}>
          <CompanyLogo uri={logoUri} name={previewCompany} size={48} />
          <View style={styles.previewBody}>
            <Text style={styles.previewTitle} numberOfLines={2}>
              {previewTitle}
            </Text>
            <Text style={styles.previewMeta} numberOfLines={1}>
              {previewCompany} · {t('common.app')}
            </Text>
          </View>
        </ToneCard>
        <FormField label={t('create.title')} value={title} onChangeText={setTitle} placeholder={t('create.titlePh')} />
        <FormField
          label={t('create.company')}
          value={companyName}
          onChangeText={setCompanyName}
          placeholder={t('create.companyPh')}
        />
        <Pressable onPress={pickLogo} style={({ pressed }) => [styles.logoBtn, pressed && formStyles.pressed]}>
          <Text style={styles.logoBtnText}>{t('company.logo')}</Text>
        </Pressable>
        <Pressable onPress={() => router.push(COMPANY_ME_HREF)} hitSlop={8}>
          <Text style={styles.link}>{t('create.openCompany')}</Text>
        </Pressable>
        <Text style={formStyles.hint}>{t('create.logoHint')}</Text>
        <PlacePicker label={t('create.city')} value={cityId} onChange={setCityId} placeholder={t('filters.placeSearch')} />
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
        <FormField
          label={t('create.contact')}
          value={contact}
          onChangeText={setContact}
          placeholder={t('create.contactPh')}
        />
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
        <Text style={formStyles.label}>{t('filters.employment')}</Text>
        <ChipWrap>
          {EMPLOYMENTS.map((id) => (
            <SelectChip
              key={id}
              id={id}
              label={t(keyOf('filters.employment', id))}
              compact
              selected={employment === id}
              onChange={toggleChip(employment, setEmployment)}
            />
          ))}
        </ChipWrap>
        <Text style={formStyles.label}>{t('create.experience')}</Text>
        <ChipWrap>
          {EXPERIENCE.map((id) => (
            <SelectChip
              key={id}
              id={id}
              label={t(keyOf('fact', id))}
              compact
              selected={experience === id}
              onChange={toggleChip(experience, setExperience)}
            />
          ))}
        </ChipWrap>
        <Text style={formStyles.label}>{t('create.schedule')}</Text>
        <ChipWrap>
          {SCHEDULES.map((id) => (
            <SelectChip
              key={id}
              id={id}
              label={t(keyOf('fact', id))}
              compact
              selected={schedule === id}
              onChange={toggleChip(schedule, setSchedule)}
            />
          ))}
        </ChipWrap>
        <FormField
          label={t('create.description')}
          value={description}
          onChangeText={setDescription}
          placeholder={t('create.descriptionPh')}
          multiline
        />
        {notice ? <Text style={styles.notice}>{notice}</Text> : null}
        <Pressable onPress={onFree} style={({ pressed }) => [formStyles.primary, pressed && formStyles.pressed]}>
          <Text style={formStyles.primaryText}>{t('create.publish')}</Text>
        </Pressable>
        <Pressable onPress={onPremium} style={({ pressed }) => [styles.premium, pressed && formStyles.pressed]}>
          <Text style={styles.premiumText}>{t('create.premium')}</Text>
        </Pressable>
      </FormScroll>
    </View>
  );
}

function createJobStyles(colors: ThemeColors, _scheme: ColorSchemeName) {
  return {
    preview: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: 12,
      padding: 14,
    },
    previewBody: { flex: 1, minWidth: 0 },
    previewTitle: { color: colors.text, fontFamily: fonts.semibold, fontSize: 15, lineHeight: 20 },
    previewMeta: { color: colors.accent, fontFamily: fonts.semibold, fontSize: 12, marginTop: 2 },
    logoBtn: { alignSelf: 'flex-start' as const, paddingVertical: 4 },
    logoBtnText: { color: colors.accent, fontFamily: fonts.semibold, fontSize: 14 },
    link: { color: colors.accent, fontFamily: fonts.semibold, fontSize: 14 },
    notice: { color: colors.danger, fontFamily: fonts.medium, fontSize: 13 },
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

import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';

import { SelectChip } from '@/components/FilterChips';
import { FormField, formStyles } from '@/components/FormField';
import { Text } from '@/components/AppText';
import { CATEGORIES } from '@/lib/catalog';
import { SALARY_CURRENCIES } from '@/lib/format';
import { LOCAL_JOBS_LIMIT } from '@/lib/tiers';
import { buildLocalJob, upsertLocalJob } from '@/lib/store/localJobsSlice';
import { jobHref } from '@/lib/jobRoute';
import { pinViewedJob } from '@/lib/store/jobsSlice';
import { openPaywall } from '@/lib/store/premiumSlice';
import { useAppDispatch, useAppSelector } from '@/lib/store/hooks';
import type { CategoryId, JobTier } from '@/lib/types';
import { colors, fonts, radius } from '@/lib/theme';

const FORM_CATEGORIES = CATEGORIES.filter((item) => item.id !== 'all');

export default function CreateJobScreen() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const isPremium = useAppSelector((state) => state.premium.isPremium);
  const paywallOpen = useAppSelector((state) => state.premium.paywallOpen);
  const localCount = useAppSelector((state) => state.localJobs.items.length);

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
        Alert.alert('Не хватает данных', 'Укажите должность и компанию.');
        return;
      }
      if (localCount >= LOCAL_JOBS_LIMIT) {
        Alert.alert('Лимит', `На устройстве можно хранить не больше ${LOCAL_JOBS_LIMIT} своих вакансий.`);
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
    [dispatch, localCount, router],
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
        <Text style={formStyles.lead}>Вакансия появится в ленте на этом устройстве. Позже это уйдёт на сервер.</Text>
        <FormField label="Должность" value={title} onChangeText={setTitle} placeholder="Например, продавец" />
        <FormField label="Компания" value={company} onChangeText={setCompany} placeholder="Название" />
        <FormField label="Город" value={location} onChangeText={setLocation} placeholder="Москва" />
        <FormField
          label="Зарплата"
          value={salary}
          onChangeText={setSalary}
          placeholder="150 000"
          keyboardType="numeric"
        />
        <Text style={formStyles.label}>Валюта</Text>
        <View style={formStyles.wrap}>
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
        </View>
        <FormField label="Контакт" value={contact} onChangeText={setContact} placeholder="Телефон или Telegram" />
        <Text style={formStyles.label}>Сфера</Text>
        <View style={formStyles.wrap}>
          {FORM_CATEGORIES.map((item) => (
            <SelectChip
              key={item.id}
              id={item.id}
              label={item.label}
              compact
              selected={category === item.id}
              onChange={onCategory}
            />
          ))}
        </View>
        <View style={formStyles.wrap}>
          <SelectChip id="office" label="Офис" compact selected={!remote} onChange={onOffice} />
          <SelectChip id="remote" label="Удалёнка" compact selected={remote} onChange={onRemote} />
        </View>
        <FormField
          label="Описание"
          value={description}
          onChangeText={setDescription}
          placeholder="Обязанности, условия"
          multiline
        />
        <Pressable onPress={onFree} style={({ pressed }) => [formStyles.primary, pressed && formStyles.pressed]}>
          <Text style={formStyles.primaryText}>Опубликовать</Text>
        </Pressable>
        <Pressable onPress={onPremium} style={({ pressed }) => [styles.premium, pressed && formStyles.pressed]}>
          <Text style={styles.premiumText}>Премиум-размещение</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  premium: {
    height: 48,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  premiumText: { color: colors.accent, fontFamily: fonts.semibold, fontSize: 16 },
});

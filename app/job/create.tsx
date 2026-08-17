import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';

import { SelectChip } from '@/components/FilterChips';
import { CATEGORIES } from '@/lib/catalog';
import { SALARY_CURRENCIES } from '@/lib/format';
import { LOCAL_JOBS_LIMIT } from '@/lib/tiers';
import { buildLocalJob, upsertLocalJob } from '@/lib/store/localJobsSlice';
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
      router.replace(`/job/${encodeURIComponent(job.id)}`);
    },
    [dispatch, localCount, router],
  );

  const onFree = useCallback(() => publish(2), [publish]);

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
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.lead}>Вакансия появится в ленте на этом устройстве. Позже это уйдёт на сервер.</Text>
        <Field label="Должность" value={title} onChangeText={setTitle} placeholder="Например, продавец" />
        <Field label="Компания" value={company} onChangeText={setCompany} placeholder="Название" />
        <Field label="Город" value={location} onChangeText={setLocation} placeholder="Москва" />
        <Field
          label="Зарплата"
          value={salary}
          onChangeText={setSalary}
          placeholder="150 000"
          keyboardType="numeric"
        />
        <Text style={styles.label}>Валюта</Text>
        <View style={styles.wrap}>
          {SALARY_CURRENCIES.map((item) => (
            <SelectChip
              key={item.id}
              id={item.id}
              label={`${item.label} ${item.id}`}
              compact
              selected={currency === item.id}
              onChange={(id) => setCurrency(String(id))}
            />
          ))}
        </View>
        <Field label="Контакт" value={contact} onChangeText={setContact} placeholder="Телефон или Telegram" />
        <Text style={styles.label}>Сфера</Text>
        <View style={styles.wrap}>
          {FORM_CATEGORIES.map((item) => (
            <SelectChip
              key={item.id}
              id={item.id}
              label={item.label}
              compact
              selected={category === item.id}
              onChange={(id) => setCategory(id as CategoryId)}
            />
          ))}
        </View>
        <View style={styles.wrap}>
          <SelectChip id="office" label="Офис" compact selected={!remote} onChange={() => setRemote(false)} />
          <SelectChip id="remote" label="Удалёнка" compact selected={remote} onChange={() => setRemote(true)} />
        </View>
        <Field
          label="Описание"
          value={description}
          onChangeText={setDescription}
          placeholder="Обязанности, условия"
          multiline
        />
        <Pressable onPress={onFree} style={({ pressed }) => [styles.primary, pressed && styles.pressed]}>
          <Text style={styles.primaryText}>Опубликовать</Text>
        </Pressable>
        <Pressable onPress={onPremium} style={({ pressed }) => [styles.premium, pressed && styles.pressed]}>
          <Text style={styles.premiumText}>Премиум-размещение</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Field({
  label,
  value,
  onChangeText,
  placeholder,
  multiline,
  keyboardType,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  multiline?: boolean;
  keyboardType?: 'default' | 'numeric';
}) {
  return (
    <View>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.placeholder}
        style={[styles.input, multiline && styles.area]}
        multiline={multiline}
        keyboardType={keyboardType}
        textAlignVertical={multiline ? 'top' : 'center'}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 20, paddingBottom: 40, gap: 12 },
  lead: { color: colors.muted, fontFamily: fonts.medium, fontSize: 14, lineHeight: 20, marginBottom: 4 },
  label: { color: colors.muted, fontFamily: fonts.semibold, fontSize: 12, marginBottom: 6 },
  input: {
    minHeight: 44,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.chipBorder,
    backgroundColor: colors.card,
    color: colors.text,
    fontFamily: fonts.medium,
    fontSize: 15,
    paddingHorizontal: 12,
  },
  area: { minHeight: 120, paddingTop: 12 },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  primary: {
    marginTop: 8,
    height: 48,
    borderRadius: radius.md,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryText: { color: colors.accentText, fontFamily: fonts.bold, fontSize: 16 },
  premium: {
    height: 48,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  premiumText: { color: colors.accent, fontFamily: fonts.semibold, fontSize: 16 },
  pressed: { opacity: 0.86 },
});

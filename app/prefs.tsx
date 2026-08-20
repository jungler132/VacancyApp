import { useCallback, useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';

import { ChoiceTiles } from '@/components/ChoiceTiles';
import { FormField, useFormStyles } from '@/components/FormField';
import { FormScroll } from '@/components/FormScroll';
import { Text } from '@/components/AppText';
import { beginNav } from '@/lib/navLock';
import { keyOf } from '@/lib/i18n';
import { useT } from '@/lib/i18n/useT';
import { prefsFilled, searchFromPrefs } from '@/lib/prefs';
import { applySearch } from '@/lib/store/filtersSlice';
import { savePrefs } from '@/lib/store/identitySlice';
import { useAppDispatch, useAppSelector } from '@/lib/store/hooks';
import type { WorkFormat } from '@/lib/filters';

const FORMATS: WorkFormat[] = ['any', 'remote', 'office'];

export default function PrefsScreen() {
  const t = useT();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const formStyles = useFormStyles();
  const stored = useAppSelector((state) => state.identity);
  const [title, setTitle] = useState(stored.title);
  const [format, setFormat] = useState<WorkFormat>(stored.format);
  const [seeking, setSeeking] = useState(stored.seeking);
  const [available, setAvailable] = useState(stored.available);

  const statusItems = useMemo(
    () => [
      { id: 'seeking', label: t('identity.seeking') },
      { id: 'available', label: t('identity.available') },
    ],
    [t],
  );
  const formatItems = useMemo(
    () => FORMATS.map((id) => ({ id, label: t(keyOf('filters.format', id)) })),
    [t],
  );
  const statusSelected = useMemo(
    () => [seeking ? 'seeking' : '', available ? 'available' : ''].filter(Boolean),
    [available, seeking],
  );

  const onStatus = useCallback((id: string) => {
    if (id === 'seeking') setSeeking((value) => !value);
    if (id === 'available') setAvailable((value) => !value);
  }, []);
  const onFormat = useCallback((id: string) => {
    setFormat(id as WorkFormat);
  }, []);

  const onSave = useCallback(() => {
    dispatch(savePrefs({ title, format, seeking, available }));
    if (!beginNav()) return;
    const next = { title, format };
    if (prefsFilled(next)) dispatch(applySearch(searchFromPrefs(next)));
    if (seeking && prefsFilled(next)) {
      router.replace('/');
      return;
    }
    router.back();
  }, [available, dispatch, format, router, seeking, title]);

  return (
    <View style={formStyles.screen}>
      <FormScroll contentContainerStyle={formStyles.content}>
        <Text style={formStyles.lead}>{t('prefs.lead')}</Text>
        <View>
          <Text style={formStyles.label}>{t('prefs.status')}</Text>
          <ChoiceTiles items={statusItems} selected={statusSelected} onChange={onStatus} />
        </View>
        <FormField label={t('prefs.title')} value={title} onChangeText={setTitle} placeholder={t('prefs.titlePh')} />
        <View>
          <Text style={formStyles.label}>{t('filters.format')}</Text>
          <ChoiceTiles items={formatItems} selected={format} onChange={onFormat} />
        </View>
        <Pressable onPress={onSave} style={({ pressed }) => [formStyles.primary, pressed && formStyles.pressed]}>
          <Text style={formStyles.primaryText}>{t('common.save')}</Text>
        </Pressable>
      </FormScroll>
    </View>
  );
}

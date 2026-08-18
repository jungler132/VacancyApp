import { useCallback, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView } from 'react-native';
import { useLockedNav } from '@/lib/hooks/useLockedNav';

import { FormField, useFormStyles } from '@/components/FormField';
import { Text } from '@/components/AppText';
import { useT } from '@/lib/i18n/useT';
import { jobHref } from '@/lib/jobRoute';
import { makeTrackedJob, PIPELINE_LIMIT } from '@/lib/pipeline';
import { pinViewedJob } from '@/lib/store/jobsSlice';
import { setApplyStatus } from '@/lib/store/savedSlice';
import { useAppDispatch, useAppSelector } from '@/lib/store/hooks';

export default function PipelineAddScreen() {
  const t = useT();
  const nav = useLockedNav();
  const dispatch = useAppDispatch();
  const formStyles = useFormStyles();
  const pipelineCount = useAppSelector((state) => Object.keys(state.saved.statuses).length);
  const [title, setTitle] = useState('');
  const [company, setCompany] = useState('');
  const [url, setUrl] = useState('');

  const onSave = useCallback(() => {
    const nextTitle = title.trim();
    const nextCompany = company.trim();
    if (!nextTitle || !nextCompany) {
      Alert.alert(t('common.missing'), t('pipeline.needFields'));
      return;
    }
    if (pipelineCount >= PIPELINE_LIMIT) {
      Alert.alert(t('common.limit'), t('pipeline.limit', { limit: PIPELINE_LIMIT }));
      return;
    }
    const job = makeTrackedJob({ title: nextTitle, company: nextCompany, url });
    dispatch(setApplyStatus({ job, status: 'applied' }));
    dispatch(pinViewedJob(job));
    nav.replace(jobHref(job.id));
  }, [company, dispatch, nav, pipelineCount, t, title, url]);

  return (
    <KeyboardAvoidingView style={formStyles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={formStyles.content} keyboardShouldPersistTaps="handled">
        <Text style={formStyles.lead}>{t('pipeline.addLead')}</Text>
        <FormField label={t('pipeline.title')} value={title} onChangeText={setTitle} placeholder={t('pipeline.titlePh')} />
        <FormField label={t('pipeline.company')} value={company} onChangeText={setCompany} placeholder={t('pipeline.companyPh')} />
        <FormField label={t('pipeline.url')} value={url} onChangeText={setUrl} placeholder={t('pipeline.urlPh')} />
        <Pressable onPress={onSave} style={({ pressed }) => [formStyles.primary, pressed && formStyles.pressed]}>
          <Text style={formStyles.primaryText}>{t('pipeline.add')}</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

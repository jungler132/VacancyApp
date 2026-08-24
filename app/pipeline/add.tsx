import { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, View } from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';

import { FormField, useFormStyles } from '@/components/FormField';
import { FormScroll } from '@/components/FormScroll';
import { Text } from '@/components/AppText';
import { showAppNotice } from '@/lib/appNotice';
import { useLockedNav } from '@/lib/hooks/useLockedNav';
import { useT } from '@/lib/i18n/useT';
import { jobHref } from '@/lib/jobRoute';
import { makeTrackedJob, patchTrackedJob } from '@/lib/pipeline';
import { useLimits } from '@/lib/hooks/useLimits';
import { pinViewedJob } from '@/lib/store/jobsSlice';
import { patchSavedJob, setApplyStatus } from '@/lib/store/savedSlice';
import { useAppDispatch, useAppSelector } from '@/lib/store/hooks';

export default function PipelineAddScreen() {
  const t = useT();
  const nav = useLockedNav();
  const dispatch = useAppDispatch();
  const formStyles = useFormStyles();
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const editId = Array.isArray(params.id) ? params.id[0] : params.id;
  const existing = useAppSelector((state) => {
    if (!editId) return undefined;
    return (
      state.saved.items.find((item) => item.id === editId) ??
      state.jobs.byId[editId] ??
      (state.jobs.viewedId === editId ? state.jobs.byId[editId] : undefined)
    );
  });
  const editing = Boolean(existing);
  const pipelineCount = useAppSelector((state) => Object.keys(state.saved.statuses).length);
  const limits = useLimits();
  const [title, setTitle] = useState('');
  const [company, setCompany] = useState('');
  const [url, setUrl] = useState('');
  const [note, setNote] = useState('');
  const filled = useRef(false);

  useEffect(() => {
    if (!existing || filled.current) return;
    filled.current = true;
    setTitle(existing.title);
    setCompany(existing.company);
    setUrl(existing.url);
    setNote(existing.description || existing.excerpt || '');
  }, [existing]);

  const onSave = useCallback(() => {
    const nextTitle = title.trim();
    const nextCompany = company.trim();
    if (!nextTitle || !nextCompany) {
      showAppNotice(t('common.missing'), t('pipeline.needFields'));
      return;
    }
    if (editing && existing) {
      const job = patchTrackedJob(existing, {
        title: nextTitle,
        company: nextCompany,
        url,
        description: note,
      });
      dispatch(patchSavedJob(job));
      dispatch(pinViewedJob(job));
      nav.replace(jobHref(job.id));
      return;
    }
    if (pipelineCount >= limits.pipeline) {
      showAppNotice(t('common.limit'), t('pipeline.limit', { limit: limits.pipeline }));
      return;
    }
    const job = makeTrackedJob({ title: nextTitle, company: nextCompany, url });
    const withNote = note.trim()
      ? { ...job, description: note.trim(), excerpt: note.trim().slice(0, 180) }
      : job;
    dispatch(setApplyStatus({ job: withNote, status: 'applied' }));
    dispatch(pinViewedJob(withNote));
    nav.replace(jobHref(withNote.id));
  }, [company, dispatch, editing, existing, limits.pipeline, nav, note, pipelineCount, t, title, url]);

  return (
    <View style={formStyles.screen}>
      <Stack.Screen options={{ title: t(editing ? 'pipeline.edit' : 'nav.pipelineAdd') }} />
      <FormScroll contentContainerStyle={formStyles.content}>
        <Text style={formStyles.lead}>{t(editing ? 'pipeline.edit' : 'pipeline.addLead')}</Text>
        <FormField label={t('pipeline.title')} value={title} onChangeText={setTitle} placeholder={t('pipeline.titlePh')} />
        <FormField label={t('pipeline.company')} value={company} onChangeText={setCompany} placeholder={t('pipeline.companyPh')} />
        <FormField label={t('pipeline.url')} value={url} onChangeText={setUrl} placeholder={t('pipeline.urlPh')} />
        <FormField
          label={t('pipeline.note')}
          value={note}
          onChangeText={setNote}
          placeholder={t('pipeline.notePh')}
          multiline
        />
        <Pressable onPress={onSave} style={({ pressed }) => [formStyles.primary, pressed && formStyles.pressed]}>
          <Text style={formStyles.primaryText}>{t(editing ? 'pipeline.save' : 'pipeline.add')}</Text>
        </Pressable>
      </FormScroll>
    </View>
  );
}

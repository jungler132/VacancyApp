import { useCallback, useState } from 'react';
import { Pressable, View } from 'react-native';

import { FormField, useFormStyles } from '@/components/FormField';
import { FormScroll } from '@/components/FormScroll';
import { Text } from '@/components/AppText';
import { showAppNotice } from '@/lib/appNotice';
import { useLockedNav } from '@/lib/hooks/useLockedNav';
import { useT } from '@/lib/i18n/useT';
import { jobHref } from '@/lib/jobRoute';
import { makeTrackedJob } from '@/lib/pipeline';
import { useLimits } from '@/lib/hooks/useLimits';
import { pinViewedJob } from '@/lib/store/jobsSlice';
import { setApplyStatus } from '@/lib/store/savedSlice';
import { useAppDispatch, useAppSelector } from '@/lib/store/hooks';

export default function PipelineAddScreen() {
  const t = useT();
  const nav = useLockedNav();
  const dispatch = useAppDispatch();
  const formStyles = useFormStyles();
  const pipelineCount = useAppSelector((state) => Object.keys(state.saved.statuses).length);
  const limits = useLimits();
  const [title, setTitle] = useState('');
  const [company, setCompany] = useState('');
  const [url, setUrl] = useState('');

  const onSave = useCallback(() => {
    const nextTitle = title.trim();
    const nextCompany = company.trim();
    if (!nextTitle || !nextCompany) {
      showAppNotice(t('common.missing'), t('pipeline.needFields'));
      return;
    }
    if (pipelineCount >= limits.pipeline) {
      showAppNotice(t('common.limit'), t('pipeline.limit', { limit: limits.pipeline }));
      return;
    }
    const job = makeTrackedJob({ title: nextTitle, company: nextCompany, url });
    dispatch(setApplyStatus({ job, status: 'applied' }));
    dispatch(pinViewedJob(job));
    nav.replace(jobHref(job.id));
  }, [company, dispatch, limits.pipeline, nav, pipelineCount, t, title, url]);

  return (
    <View style={formStyles.screen}>
      <FormScroll contentContainerStyle={formStyles.content}>
        <Text style={formStyles.lead}>{t('pipeline.addLead')}</Text>
        <FormField label={t('pipeline.title')} value={title} onChangeText={setTitle} placeholder={t('pipeline.titlePh')} />
        <FormField label={t('pipeline.company')} value={company} onChangeText={setCompany} placeholder={t('pipeline.companyPh')} />
        <FormField label={t('pipeline.url')} value={url} onChangeText={setUrl} placeholder={t('pipeline.urlPh')} />
        <Pressable onPress={onSave} style={({ pressed }) => [formStyles.primary, pressed && formStyles.pressed]}>
          <Text style={formStyles.primaryText}>{t('pipeline.add')}</Text>
        </Pressable>
      </FormScroll>
    </View>
  );
}

import { useCallback, useMemo } from 'react';
import { Pressable, View } from 'react-native';

import { PipelineBoard } from '@/components/PipelineBoard';
import { Text } from '@/components/AppText';
import { useT } from '@/lib/i18n/useT';
import { useLockedNav } from '@/lib/hooks/useLockedNav';
import { jobHref } from '@/lib/jobRoute';
import { pipelineStats } from '@/lib/pipeline';
import { PIPELINE_ADD_HREF } from '@/lib/services/catalog';
import type { ApplyStatus } from '@/lib/apply';
import type { Job } from '@/lib/types';
import { pinViewedJob } from '@/lib/store/jobsSlice';
import { setApplyStatus } from '@/lib/store/savedSlice';
import { useAppDispatch, useAppSelector } from '@/lib/store/hooks';
import { fonts, useThemedStyles, type ThemeColors } from '@/lib/theme';

export default function PipelineScreen() {
  const t = useT();
  const nav = useLockedNav();
  const dispatch = useAppDispatch();
  const styles = useThemedStyles(pipelineScreenStyles);
  const jobs = useAppSelector((state) => state.saved.items);
  const statuses = useAppSelector((state) => state.saved.statuses);
  const statusAt = useAppSelector((state) => state.saved.statusAt);
  const stats = useMemo(() => pipelineStats(jobs, statuses, statusAt), [jobs, statusAt, statuses]);
  const summary = stats.total
    ? t('pipeline.summary', {
        total: stats.total,
        replies: stats.replies,
        source: stats.bestSource ?? t('pipeline.noSource'),
      })
    : t('pipeline.empty');

  const openJob = useCallback(
    (job: Job) => {
      dispatch(pinViewedJob(job));
      nav.push(jobHref(job.id));
    },
    [dispatch, nav],
  );
  const dropJob = useCallback(
    (job: Job, status: ApplyStatus) => {
      dispatch(setApplyStatus({ job, status }));
    },
    [dispatch],
  );

  return (
    <View style={styles.screen}>
      <View style={styles.top}>
        <Text style={styles.summary}>{summary}</Text>
        <Pressable onPress={() => nav.push(PIPELINE_ADD_HREF)} hitSlop={8}>
          <Text style={styles.link}>{t('pipeline.add')}</Text>
        </Pressable>
      </View>
      <PipelineBoard jobs={jobs} statuses={statuses} onOpen={openJob} onDrop={dropJob} />
    </View>
  );
}

function pipelineScreenStyles(colors: ThemeColors) {
  return {
    screen: { flex: 1, backgroundColor: colors.bg },
    top: {
      flexDirection: 'row' as const,
      alignItems: 'flex-start' as const,
      justifyContent: 'space-between' as const,
      gap: 12,
      paddingHorizontal: 16,
      paddingTop: 8,
      paddingBottom: 4,
    },
    summary: { flex: 1, color: colors.faint, fontFamily: fonts.medium, fontSize: 13, lineHeight: 18 },
    link: { color: colors.accent, fontFamily: fonts.semibold, fontSize: 14 },
  };
}

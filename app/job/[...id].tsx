import { useLocalSearchParams, useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useCallback, useEffect, useMemo } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { ActivityIndicator, Button, Text } from 'react-native-paper';

import { AppChip } from '@/components/AppChip';
import { CopyLinkButton } from '@/components/CopyLinkButton';
import { EmptyState } from '@/components/EmptyState';
import { SelectChip } from '@/components/FilterChips';
import { requestInterstitial } from '@/lib/ads';
import { APPLY_STATUSES, type ApplyStatus } from '@/lib/apply';
import { displayName, formatDate, formatPlace, joinMeta, jobFacts, stripHtml } from '@/lib/format';
import { Text as AppText } from '@/components/AppText';
import { colors, fonts, radius } from '@/lib/theme';
import { useAppDispatch, useAppSelector } from '@/lib/store/hooks';
import { isHhJobId } from '@/lib/api/providers/hh';
import { hydrateJob } from '@/lib/store/jobsSlice';
import { removeLocalJob } from '@/lib/store/localJobsSlice';
import { matchRouteJobId, parseJobIdParam } from '@/lib/jobRoute';
import { selectIsSaved, selectJobById, selectViewedJob } from '@/lib/store/selectors';
import { setApplyStatus, toggleSaved } from '@/lib/store/savedSlice';
import { isLocalJob, jobTier } from '@/lib/tiers';

export default function JobDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string | string[] }>();
  const decoded = parseJobIdParam(id);
  const router = useRouter();
  const dispatch = useAppDispatch();
  const viewed = useAppSelector(selectViewedJob);
  const byId = useAppSelector((state) => state.jobs.byId);
  const lookupId = matchRouteJobId(decoded, Object.keys(byId), viewed?.id);
  const jobFromId = useAppSelector(selectJobById(lookupId));
  const job = jobFromId ?? viewed;
  const saved = useAppSelector(selectIsSaved(job?.id ?? lookupId));
  const applyStatus = useAppSelector((state) => state.saved.statuses[job?.id ?? lookupId]);

  useEffect(() => {
    if (!decoded || decoded.startsWith('workly:')) return;
    requestInterstitial();
  }, [decoded]);

  useEffect(() => {
    const jobId = job?.id ?? lookupId;
    if (!isHhJobId(jobId) || job?.description) return;
    const action = dispatch(hydrateJob(jobId));
    return () => action.abort();
  }, [dispatch, job?.description, job?.id, lookupId]);

  const open = useCallback(() => {
    if (!job) return;
    dispatch(setApplyStatus({ job, status: 'applied' }));
    if (job.url) WebBrowser.openBrowserAsync(job.url);
  }, [dispatch, job]);

  const toggle = useCallback(() => {
    if (job) dispatch(toggleSaved(job));
  }, [dispatch, job]);

  const onDelete = useCallback(() => {
    if (!job || !isLocalJob(job)) return;
    dispatch(removeLocalJob(job.id));
    router.back();
  }, [dispatch, job, router]);

  const onStatus = useCallback(
    (id: string | number) => {
      if (!job) return;
      const next = id as ApplyStatus;
      dispatch(setApplyStatus({ job, status: applyStatus === next ? null : next }));
    },
    [applyStatus, dispatch, job],
  );

  const body = useMemo(() => stripHtml(job?.description || job?.excerpt || ''), [job?.description, job?.excerpt]);
  const snippetOnly = Boolean(body) && (body.length < 480 || /(?:\.{3}|…)\s*$/.test(body) || (body.match(/\.{3}|…/g)?.length ?? 0) >= 2);

  const meta = useMemo(() => {
    if (!job) return '';
    return joinMeta([formatPlace(job.location, job.remote), formatDate(job.publishedAt)]);
  }, [job]);

  const facts = useMemo(() => (job ? jobFacts(job) : []), [job]);

  if (!job) {
    return (
      <View style={styles.center}>
        <EmptyState title="Вакансия не найдена" subtitle="Вернитесь к ленте и выберите другую." />
      </View>
    );
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text variant="labelMedium" style={styles.company}>
        {displayName(job.company)}
      </Text>
      <Text variant="headlineSmall">{job.title}</Text>
      {meta ? (
        <Text variant="bodyMedium" style={styles.meta}>
          {meta}
        </Text>
      ) : null}
      {job.salary ? (
        <Text variant="titleMedium" style={styles.salary}>
          {job.salary}
        </Text>
      ) : null}
      {facts.length ? (
        <View style={styles.facts}>
          {facts.map((fact) => (
            <View key={fact.label} style={styles.fact}>
              <Text variant="labelSmall" style={styles.factLabel}>
                {fact.label}
              </Text>
              <Text variant="bodyMedium" style={styles.factValue}>
                {fact.value}
              </Text>
            </View>
          ))}
        </View>
      ) : null}
      <View style={styles.tag}>
        <AppChip label={jobTier(job) === 1 ? 'Премиум' : job.sourceName} selected />
      </View>
      {job.contact ? (
        <Text variant="bodyMedium" style={styles.meta}>
          Контакт: {job.contact}
        </Text>
      ) : null}
      <Text variant="labelSmall" style={styles.statusTitle}>
        Статус отклика
      </Text>
      <View style={styles.statusRow}>
        {APPLY_STATUSES.map((item) => (
          <SelectChip
            key={item.id}
            id={item.id}
            label={item.label}
            compact
            selected={applyStatus === item.id}
            onChange={onStatus}
          />
        ))}
      </View>

      {!job.description && isHhJobId(job.id) ? <ActivityIndicator style={{ marginVertical: 16 }} /> : null}

      {body ? (
        <AppText style={styles.body} selectable>
          {body}
        </AppText>
      ) : null}
      {snippetOnly ? (
        <AppText style={styles.snippetHint}>Полное описание откроется на сайте источника.</AppText>
      ) : null}

      {job.url ? (
        <Button mode="contained" onPress={open} style={styles.primary}>
          Откликнуться
        </Button>
      ) : null}
      {job.url ? <CopyLinkButton url={job.url} /> : null}
      <Button mode="outlined" onPress={toggle} icon={saved ? 'star' : 'star-outline'} style={styles.secondary}>
        {saved ? 'Убрать из избранного' : 'Сохранить'}
      </Button>
      {isLocalJob(job) ? (
        <Button mode="text" onPress={onDelete} textColor={colors.danger} style={styles.secondary}>
          Удалить вакансию
        </Button>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 20, paddingBottom: 48 },
  center: { flex: 1, backgroundColor: colors.bg, justifyContent: 'center', padding: 24 },
  company: { marginBottom: 8, opacity: 0.8 },
  meta: { marginTop: 12, opacity: 0.85 },
  salary: { color: colors.salary, marginTop: 14 },
  facts: { marginTop: 16, gap: 8 },
  fact: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  factLabel: { opacity: 0.55 },
  factValue: { flexShrink: 1, textAlign: 'right' },
  tag: { alignSelf: 'flex-start', marginTop: 14, marginBottom: 8 },
  statusTitle: { marginTop: 8, marginBottom: 8, opacity: 0.7 },
  statusRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  body: {
    marginTop: 8,
    marginBottom: 12,
    color: colors.text,
    fontFamily: fonts.regular,
    fontSize: 16,
    lineHeight: 24,
  },
  snippetHint: {
    color: colors.faint,
    fontFamily: fonts.medium,
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 8,
  },
  primary: { marginTop: 20, borderRadius: radius.md },
  secondary: { marginTop: 10, borderRadius: radius.md },
});

import { useLocalSearchParams } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useCallback, useEffect, useMemo } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { ActivityIndicator, Button, Text } from 'react-native-paper';

import { AppChip } from '@/components/AppChip';
import { CopyLinkButton } from '@/components/CopyLinkButton';
import { EmptyState } from '@/components/EmptyState';
import { displayName, formatDate, formatEmployment, formatPlace, joinMeta, splitParagraphs } from '@/lib/format';
import { useAppDispatch, useAppSelector } from '@/lib/store/hooks';
import { hydrateJob } from '@/lib/store/jobsSlice';
import { toggleSaved } from '@/lib/store/savedSlice';
import { colors, radius } from '@/lib/theme';

export default function JobDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const decoded = decodeURIComponent(Array.isArray(id) ? id[0] : (id ?? ''));
  const dispatch = useAppDispatch();
  const job = useAppSelector((state) => state.jobs.byId[decoded] ?? state.saved.items.find((item) => item.id === decoded));
  const saved = useAppSelector((state) => state.saved.items.some((item) => item.id === decoded));

  useEffect(() => {
    if (!decoded.startsWith('hh:') || job?.description) return;
    const action = dispatch(hydrateJob(decoded));
    return () => action.abort();
  }, [decoded, dispatch, job?.description]);

  const open = useCallback(() => {
    if (job?.url) WebBrowser.openBrowserAsync(job.url);
  }, [job?.url]);

  const toggle = useCallback(() => {
    if (job) dispatch(toggleSaved(job));
  }, [dispatch, job]);

  const paragraphs = useMemo(
    () => splitParagraphs(job?.description || job?.excerpt || ''),
    [job?.description, job?.excerpt],
  );

  const meta = useMemo(() => {
    if (!job) return '';
    return joinMeta([formatPlace(job.location, job.remote), formatEmployment(job.employment), formatDate(job.publishedAt)]);
  }, [job]);

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
      <View style={styles.tag}>
        <AppChip label={job.sourceName} selected />
      </View>

      {!job.description && decoded.startsWith('hh:') ? <ActivityIndicator style={{ marginVertical: 16 }} /> : null}

      {paragraphs.map((paragraph, index) => (
        <Text key={`${index}-${paragraph.slice(0, 24)}`} variant="bodyLarge" style={styles.body}>
          {paragraph}
        </Text>
      ))}

      <Button mode="contained" onPress={open} style={styles.primary}>
        Откликнуться
      </Button>
      <CopyLinkButton url={job.url} />
      <Button mode="outlined" onPress={toggle} icon={saved ? 'star' : 'star-outline'} style={styles.secondary}>
        {saved ? 'Убрать из избранного' : 'Сохранить'}
      </Button>
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
  tag: { alignSelf: 'flex-start', marginTop: 14, marginBottom: 20 },
  body: { marginBottom: 12, lineHeight: 23 },
  primary: { marginTop: 20, borderRadius: radius.md },
  secondary: { marginTop: 10, borderRadius: radius.md },
});

import { useLocalSearchParams } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useCallback, useEffect, useMemo } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { CopyLinkButton } from '@/components/CopyLinkButton';
import { displayName, formatDate, formatEmployment, formatPlace, joinMeta, splitParagraphs } from '@/lib/format';
import { useAppDispatch, useAppSelector } from '@/lib/store/hooks';
import { hydrateJob } from '@/lib/store/jobsSlice';
import { toggleSaved } from '@/lib/store/savedSlice';
import { colors, fonts, radius } from '@/lib/theme';

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
        <Text style={styles.muted}>Вакансия не найдена</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.company}>{displayName(job.company)}</Text>
      <Text style={styles.title}>{job.title}</Text>
      {meta ? <Text style={styles.meta}>{meta}</Text> : null}
      {job.salary ? <Text style={styles.salary}>{job.salary}</Text> : null}
      <View style={styles.sourceRow}>
        <Text style={styles.tag}>{job.sourceName}</Text>
      </View>

      {!job.description && decoded.startsWith('hh:') ? (
        <ActivityIndicator color={colors.accent} style={{ marginVertical: 16 }} />
      ) : null}

      {paragraphs.length
        ? paragraphs.map((paragraph, index) => (
            <Text key={`${index}-${paragraph.slice(0, 24)}`} style={styles.body}>
              {paragraph}
            </Text>
          ))
        : null}

      <Pressable style={styles.primary} onPress={open}>
        <Text style={styles.primaryText}>Откликнуться</Text>
      </Pressable>
      <CopyLinkButton url={job.url} />
      <Pressable style={styles.secondary} onPress={toggle}>
        <Text style={styles.secondaryText}>{saved ? 'Убрать из избранного' : 'Сохранить'}</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 20, paddingBottom: 48 },
  center: { flex: 1, backgroundColor: colors.bg, justifyContent: 'center', padding: 24 },
  company: { color: colors.muted, fontSize: 13, marginBottom: 8, fontFamily: fonts.medium, letterSpacing: 0.3 },
  title: { color: colors.text, fontSize: 24, fontFamily: fonts.bold, lineHeight: 31 },
  meta: { color: colors.muted, marginTop: 12, fontFamily: fonts.regular, fontSize: 14, lineHeight: 20 },
  salary: { color: colors.salary, fontFamily: fonts.semibold, fontSize: 18, marginTop: 14 },
  sourceRow: { marginTop: 14, marginBottom: 20 },
  tag: {
    alignSelf: 'flex-start',
    color: colors.accent,
    borderWidth: 1.5,
    borderColor: '#245C48',
    backgroundColor: colors.accentDim,
    borderRadius: radius.sm,
    paddingHorizontal: 8,
    paddingVertical: 4,
    fontFamily: fonts.semibold,
    fontSize: 12,
    overflow: 'hidden',
  },
  body: { color: colors.text, lineHeight: 23, fontSize: 15, fontFamily: fonts.regular, marginBottom: 12 },
  muted: { color: colors.muted, textAlign: 'center', fontFamily: fonts.regular },
  primary: {
    marginTop: 20,
    backgroundColor: colors.accent,
    borderRadius: radius.md,
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryText: { color: colors.accentText, fontFamily: fonts.bold, fontSize: 16 },
  secondary: {
    marginTop: 10,
    borderColor: colors.cardBorder,
    borderWidth: 1.5,
    borderRadius: radius.md,
    paddingVertical: 14,
    alignItems: 'center',
  },
  secondaryText: { color: colors.text, fontFamily: fonts.semibold },
});

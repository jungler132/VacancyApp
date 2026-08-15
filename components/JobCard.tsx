import { memo, useCallback } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';

import { displayName, formatDate, formatPlace } from '@/lib/format';
import { useAppDispatch, useAppSelector } from '@/lib/store/hooks';
import { toggleSaved } from '@/lib/store/savedSlice';
import type { Job } from '@/lib/types';
import { colors, fonts } from '@/lib/theme';

export const JobCard = memo(function JobCard({ jobId }: { jobId: string }) {
  const job = useAppSelector((state) => state.jobs.byId[jobId] ?? state.saved.items.find((item) => item.id === jobId));
  const saved = useAppSelector((state) => state.saved.items.some((item) => item.id === jobId));
  if (!job) return null;
  return <JobCardView job={job} saved={saved} />;
});

const JobCardView = memo(function JobCardView({ job, saved }: { job: Job; saved: boolean }) {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const company = displayName(job.company);

  const open = useCallback(() => {
    router.push(`/job/${encodeURIComponent(job.id)}`);
  }, [job.id, router]);

  const onToggle = useCallback(() => {
    dispatch(toggleSaved(job));
  }, [dispatch, job]);

  const apply = useCallback(() => {
    if (job.url) WebBrowser.openBrowserAsync(job.url);
  }, [job.url]);

  return (
    <Pressable onPress={open} style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
      <View style={styles.top}>
        <View style={styles.avatar}>
          <Text style={styles.letter}>{(company[0] ?? '•').toUpperCase()}</Text>
        </View>
        <Text style={styles.company} numberOfLines={1}>
          {company}
        </Text>
        <Pressable onPress={onToggle} hitSlop={10}>
          <Text style={{ color: saved ? colors.accent : colors.faint, fontSize: 18 }}>{saved ? '★' : '☆'}</Text>
        </Pressable>
      </View>
      <Text style={styles.title} numberOfLines={2}>
        {job.title}
      </Text>
      <Text style={styles.meta} numberOfLines={1}>
        {[formatPlace(job.location, job.remote), formatDate(job.publishedAt)].filter(Boolean).join(' · ')}
      </Text>
      <View style={styles.footer}>
        {job.salary ? <Text style={styles.salary}>{job.salary}</Text> : <View style={styles.flex} />}
        <Pressable
          onPress={(event) => {
            event.stopPropagation();
            apply();
          }}
          style={({ pressed }) => [styles.apply, pressed && styles.applyPressed]}>
          <Text style={styles.applyText}>Откликнуться</Text>
        </Pressable>
      </View>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderColor: colors.cardBorder,
    borderWidth: 1,
    borderRadius: 8,
    padding: 14,
    marginBottom: 10,
  },
  pressed: { opacity: 0.92 },
  top: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 6,
    backgroundColor: '#0E1624',
    borderWidth: 1,
    borderColor: colors.cardBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  letter: { color: colors.accent, fontFamily: fonts.bold, fontSize: 14 },
  company: { color: colors.muted, fontSize: 13, fontFamily: fonts.medium, flex: 1 },
  title: { color: colors.text, fontSize: 16, fontFamily: fonts.bold, lineHeight: 22, marginTop: 8 },
  meta: { color: colors.faint, marginTop: 8, fontSize: 12, fontFamily: fonts.medium },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, gap: 10 },
  salary: { color: colors.salary, fontFamily: fonts.bold, fontSize: 15, flex: 1 },
  flex: { flex: 1 },
  apply: {
    backgroundColor: colors.accent,
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  applyPressed: { opacity: 0.85 },
  applyText: { color: colors.accentText, fontFamily: fonts.bold, fontSize: 13 },
});

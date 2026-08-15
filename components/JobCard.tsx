import { memo, useCallback } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import MaterialDesignIcons from '@react-native-vector-icons/material-design-icons';

import { displayName, formatDate, formatPlace } from '@/lib/format';
import { useAppDispatch, useAppSelector } from '@/lib/store/hooks';
import { toggleSaved } from '@/lib/store/savedSlice';
import type { Job } from '@/lib/types';
import { colors, fonts, radius } from '@/lib/theme';

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

  return (
    <Pressable onPress={open} style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
      <View style={styles.top}>
        <View style={styles.avatar}>
          <Text style={styles.letter}>{(company[0] ?? '•').toUpperCase()}</Text>
        </View>
        <Text style={styles.company} numberOfLines={1}>
          {company}
        </Text>
        <Pressable
          onPress={(event) => {
            event.stopPropagation();
            onToggle();
          }}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel={saved ? 'Убрать из избранного' : 'Сохранить'}>
          <MaterialDesignIcons
            name={saved ? 'star' : 'star-outline'}
            size={20}
            color={saved ? colors.accent : colors.faint}
          />
        </Pressable>
      </View>
      <Text style={styles.title} numberOfLines={2}>
        {job.title}
      </Text>
      <Text style={styles.meta} numberOfLines={1}>
        {[formatPlace(job.location, job.remote), formatDate(job.publishedAt)].filter(Boolean).join(' · ')}
      </Text>
      {job.salary ? <Text style={styles.salary}>{job.salary}</Text> : null}
    </Pressable>
  );
});

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderColor: colors.cardBorder,
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: 14,
    marginBottom: 10,
  },
  pressed: { opacity: 0.92 },
  top: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
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
  salary: { color: colors.salary, fontFamily: fonts.bold, fontSize: 15, marginTop: 12 },
});

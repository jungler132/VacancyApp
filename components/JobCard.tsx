import { memo, useCallback } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import MaterialDesignIcons from '@react-native-vector-icons/material-design-icons';

import { applyStatusLabel, type ApplyStatus } from '@/lib/apply';
import { displayName, formatDate, formatPlace } from '@/lib/format';
import { useAppDispatch, useAppSelector } from '@/lib/store/hooks';
import { selectIsSaved, selectJobById } from '@/lib/store/selectors';
import { toggleSaved } from '@/lib/store/savedSlice';
import { jobTier } from '@/lib/tiers';
import type { Job } from '@/lib/types';
import { colors, fonts, radius } from '@/lib/theme';

export const JobCard = memo(function JobCard({ jobId }: { jobId: string }) {
  const job = useAppSelector(selectJobById(jobId));
  const saved = useAppSelector(selectIsSaved(jobId));
  const applyStatus = useAppSelector((state) => state.saved.statuses[jobId]);
  if (!job) return null;
  return <JobCardView job={job} saved={saved} applyStatus={applyStatus} />;
});

const JobCardView = memo(function JobCardView({
  job,
  saved,
  applyStatus,
}: {
  job: Job;
  saved: boolean;
  applyStatus?: ApplyStatus;
}) {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const company = displayName(job.company);
  const tier = jobTier(job);

  const open = useCallback(() => {
    router.push(`/job/${encodeURIComponent(job.id)}`);
  }, [job.id, router]);

  const onToggle = useCallback(() => {
    dispatch(toggleSaved(job));
  }, [dispatch, job]);

  return (
    <Pressable
      onPress={open}
      style={({ pressed }) => [styles.card, tier === 1 && styles.premium, pressed && styles.pressed]}>
      <View style={styles.top}>
        <View style={styles.avatar}>
          <Text style={styles.letter}>{(company[0] ?? '•').toUpperCase()}</Text>
        </View>
        <Text style={styles.company} numberOfLines={1}>
          {company}
        </Text>
        {tier === 1 ? <Text style={styles.badgePrem}>Премиум</Text> : null}
        {tier === 2 ? <Text style={styles.badgeLocal}>Workly</Text> : null}
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
      {applyStatus ? <Text style={styles.status}>{applyStatusLabel(applyStatus)}</Text> : null}
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
  premium: {
    borderColor: colors.accent,
    backgroundColor: '#15241F',
  },
  badgePrem: {
    color: colors.accent,
    fontFamily: fonts.semibold,
    fontSize: 11,
  },
  badgeLocal: {
    color: colors.muted,
    fontFamily: fonts.semibold,
    fontSize: 11,
  },
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
  status: { color: colors.accent, marginTop: 8, fontSize: 12, fontFamily: fonts.semibold },
  salary: { color: colors.salary, fontFamily: fonts.bold, fontSize: 15, marginTop: 12 },
});

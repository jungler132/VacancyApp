import { memo, useCallback } from 'react';
import { Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';
import MaterialDesignIcons from '@react-native-vector-icons/material-design-icons';

import { CompanyLogo } from '@/components/CompanyLogo';
import { type ApplyStatus } from '@/lib/apply';
import { Text } from '@/components/AppText';
import { displayName, formatPlace, jobTags } from '@/lib/format';
import { keyOf, tokenLabel } from '@/lib/i18n';
import { useLocale, useT } from '@/lib/i18n/useT';
import { logoFromApplyUrl } from '@/lib/logo';
import { useAppDispatch, useAppSelector } from '@/lib/store/hooks';
import { selectIsSaved, selectJobById } from '@/lib/store/selectors';
import { pinViewedJob } from '@/lib/store/jobsSlice';
import { toggleSaved } from '@/lib/store/savedSlice';
import { jobHref } from '@/lib/jobRoute';
import { jobTier } from '@/lib/tiers';
import type { Job } from '@/lib/types';
import { fonts, radius, shadowsFor, useColors, useThemedStyles, type ColorSchemeName, type ThemeColors } from '@/lib/theme';

export const JobCard = memo(function JobCard({ jobId }: { jobId: string }) {
  const job = useAppSelector(selectJobById(jobId));
  const saved = useAppSelector(selectIsSaved(jobId));
  const applyStatus = useAppSelector((state) => state.saved.statuses[jobId]);
  const styles = useThemedStyles(jobCardStyles);
  if (!job) return <View style={styles.placeholder} />;
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
  const t = useT();
  const locale = useLocale();
  const colors = useColors();
  const styles = useThemedStyles(jobCardStyles);
  const company = displayName(job.company);
  const tier = jobTier(job);
  const tags = jobTags(job);
  const place = formatPlace(job.location, job.remote) || (job.remote ? t('fact.remote') : '');

  const open = useCallback(() => {
    dispatch(pinViewedJob(job));
    router.push(jobHref(job.id));
  }, [dispatch, job, router]);

  const onToggle = useCallback(() => {
    dispatch(toggleSaved(job));
  }, [dispatch, job]);

  return (
    <Pressable
      onPress={open}
      style={({ pressed }) => [styles.card, tier === 1 && styles.premium, pressed && styles.pressed]}>
      <View style={styles.top}>
        <CompanyLogo uri={job.companyLogo || logoFromApplyUrl(job.url)} name={company} size={56} />
        <View style={styles.head}>
          <Text style={styles.title} numberOfLines={2}>
            {job.title}
          </Text>
          <View style={styles.companyRow}>
            <Text style={styles.company} numberOfLines={1}>
              {company}
            </Text>
            {tier === 1 ? <Text style={styles.badgePrem}>{t('common.premium')}</Text> : null}
            {tier === 2 ? <Text style={styles.badgeLocal}>{t('common.workly')}</Text> : null}
          </View>
        </View>
        <Pressable
          onPress={(event) => {
            event.stopPropagation();
            onToggle();
          }}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel={saved ? t('common.unsave') : t('common.save')}>
          <MaterialDesignIcons
            name={saved ? 'star' : 'star-outline'}
            size={22}
            color={saved ? colors.accent : colors.faint}
          />
        </Pressable>
      </View>
      {place || job.salary ? (
        <View style={styles.meta}>
          {place ? (
            <View style={styles.metaItem}>
              <MaterialDesignIcons name="map-marker-outline" size={14} color={colors.faint} />
              <Text style={styles.metaText} numberOfLines={1}>
                {place}
              </Text>
            </View>
          ) : null}
          {job.salary ? (
            <View style={styles.metaItem}>
              <MaterialDesignIcons name="cash" size={14} color={colors.faint} />
              <Text style={styles.metaText} numberOfLines={1}>
                {job.salary}
              </Text>
            </View>
          ) : null}
        </View>
      ) : null}
      {tags.length ? (
        <View style={styles.tags}>
          {tags.map((tag) => (
            <Text key={tag} style={styles.tag}>
              {tokenLabel(locale, tag)}
            </Text>
          ))}
        </View>
      ) : null}
      {applyStatus ? <Text style={styles.status}>{t(keyOf('apply', applyStatus))}</Text> : null}
    </Pressable>
  );
});

function jobCardStyles(colors: ThemeColors, scheme: ColorSchemeName) {
  return {
    placeholder: { height: 148, marginBottom: 16 },
    card: {
      backgroundColor: colors.card,
      borderColor: colors.cardBorder,
      borderWidth: 1,
      borderRadius: radius.lg,
      padding: 16,
      marginBottom: 16,
      ...shadowsFor(scheme).card,
    },
    pressed: { opacity: 0.96, transform: [{ translateY: -1 }] },
    premium: {
      borderColor: colors.accentDim,
      backgroundColor: '#f8f9ff',
    },
    badgePrem: {
      color: colors.accent,
      fontFamily: fonts.semibold,
      fontSize: 11,
      flexShrink: 0,
    },
    badgeLocal: {
      color: colors.muted,
      fontFamily: fonts.semibold,
      fontSize: 11,
      flexShrink: 0,
    },
    top: { flexDirection: 'row' as const, alignItems: 'flex-start' as const, gap: 12 },
    head: { flex: 1, minWidth: 0, gap: 2 },
    title: { color: colors.text, fontSize: 16, fontFamily: fonts.semibold, lineHeight: 22 },
    companyRow: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 8, marginTop: 2 },
    company: { color: colors.muted, fontSize: 13, fontFamily: fonts.medium, flexShrink: 1 },
    meta: { flexDirection: 'row' as const, flexWrap: 'wrap' as const, gap: 12, marginTop: 12 },
    metaItem: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 4, maxWidth: '100%' as const },
    metaText: { color: colors.muted, fontSize: 12, fontFamily: fonts.medium, flexShrink: 1 },
    tags: { flexDirection: 'row' as const, flexWrap: 'wrap' as const, gap: 8, marginTop: 12 },
    tag: {
      color: colors.accent,
      fontSize: 11,
      fontFamily: fonts.medium,
      backgroundColor: colors.accentDim,
      borderRadius: radius.full,
      paddingHorizontal: 10,
      paddingVertical: 5,
      includeFontPadding: false,
    },
    status: { color: colors.accent, marginTop: 10, fontSize: 12, fontFamily: fonts.semibold },
  };
}

import { useLocalSearchParams, useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ActivityIndicator, Button, Text } from 'react-native-paper';

import { AppChip } from '@/components/AppChip';
import { ChipWrap } from '@/components/ChipWrap';
import { CopyLinkButton } from '@/components/CopyLinkButton';
import { EmptyState } from '@/components/EmptyState';
import { SelectChip } from '@/components/FilterChips';
import { CompanyLogo } from '@/components/CompanyLogo';
import { PremiumBadge } from '@/components/PremiumBadge';
import { requestInterstitial } from '@/lib/ads';
import { showAppNotice } from '@/lib/appNotice';
import { APPLY_STATUSES, type ApplyStatus } from '@/lib/apply';
import { displayName, formatDate, formatPlace, htmlToText, joinMeta, jobFacts } from '@/lib/format';
import { Text as AppText } from '@/components/AppText';
import { JobBody } from '@/components/JobBody';
import { keyOf, tokenLabel } from '@/lib/i18n';
import { logoFromApplyUrl } from '@/lib/logo';
import { useLocale, useT } from '@/lib/i18n/useT';
import { detectTextLocale, isSuccessfulTranslation, needsTranslation, translateFailCode, translateJobTexts, type JobTextBundle } from '@/lib/translate';
import { useLimits } from '@/lib/hooks/useLimits';
import { useAppDispatch, useAppSelector } from '@/lib/store/hooks';
import { isHhJobId } from '@/lib/api/providers/hh';
import { hydrateJob } from '@/lib/store/jobsSlice';
import { removeLocalJob, setLocalJobArchived } from '@/lib/store/localJobsSlice';
import { matchRouteJobId, parseJobIdParam } from '@/lib/jobRoute';
import { isTrackedJob } from '@/lib/pipeline';
import { jobCreateHref, pipelineAddHref } from '@/lib/services/catalog';
import { selectIsSaved, selectJobById, selectViewedJob } from '@/lib/store/selectors';
import { setApplyStatus, toggleSaved } from '@/lib/store/savedSlice';
import { isAppJobId, isLocalJob, jobTier } from '@/lib/tiers';
import { ToneCard } from '@/components/ToneCard';
import { inferPlaceId, placeLabel } from '@/lib/places';
import { fonts, radius, toneForTier, useColors, useThemedStyles, type ColorSchemeName, type ThemeColors } from '@/lib/theme';

export default function JobDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string | string[] }>();
  const decoded = parseJobIdParam(id);
  const router = useRouter();
  const dispatch = useAppDispatch();
  const t = useT();
  const locale = useLocale();
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const styles = useThemedStyles(jobDetailsStyles);
  const viewed = useAppSelector(selectViewedJob);
  const byId = useAppSelector((state) => state.jobs.byId);
  const lookupId = matchRouteJobId(decoded, Object.keys(byId), viewed?.id);
  const jobFromId = useAppSelector(selectJobById(lookupId));
  const job = jobFromId ?? viewed;
  const saved = useAppSelector(selectIsSaved(job?.id ?? lookupId));
  const applyStatus = useAppSelector((state) => state.saved.statuses[job?.id ?? lookupId]);
  const pipelineCount = useAppSelector((state) => Object.keys(state.saved.statuses).length);
  const jobId = job?.id;
  const ownJob = useAppSelector((state) => (jobId ? state.localJobs.items.find((item) => item.id === jobId) : undefined));
  const limits = useLimits();

  useEffect(() => {
    if (!decoded || isAppJobId(decoded)) return;
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
    if (!applyStatus && pipelineCount >= limits.pipeline) {
      showAppNotice(t('common.limit'), t('pipeline.limit', { limit: limits.pipeline }));
    } else {
      dispatch(setApplyStatus({ job, status: 'applied' }));
    }
    if (job.url) {
      Linking.openURL(job.url).catch(() => {
        WebBrowser.openBrowserAsync(job.url!).catch(() => undefined);
      });
    }
  }, [applyStatus, dispatch, job, limits.pipeline, pipelineCount, t]);

  const toggle = useCallback(() => {
    if (job) dispatch(toggleSaved(job));
  }, [dispatch, job]);

  const onDelete = useCallback(() => {
    if (!ownJob) return;
    dispatch(removeLocalJob(ownJob.id));
    router.back();
  }, [dispatch, ownJob, router]);

  const onArchive = useCallback(() => {
    if (!ownJob) return;
    dispatch(setLocalJobArchived({ id: ownJob.id, archived: !ownJob.archived }));
  }, [dispatch, ownJob]);

  const onStatus = useCallback(
    (id: string | number) => {
      if (!job) return;
      const next = id as ApplyStatus;
      if (applyStatus === next) {
        dispatch(setApplyStatus({ job, status: null }));
        return;
      }
      if (!applyStatus && pipelineCount >= limits.pipeline) {
        showAppNotice(t('common.limit'), t('pipeline.limit', { limit: limits.pipeline }));
        return;
      }
      dispatch(setApplyStatus({ job, status: next }));
    },
    [applyStatus, dispatch, job, limits.pipeline, pipelineCount, t],
  );

  const body = useMemo(() => htmlToText(job?.description || job?.excerpt || ''), [job?.description, job?.excerpt]);
  const snippetOnly = Boolean(body) && (body.replace(/\s+/g, ' ').length < 480 || /(?:\.{3}|…)\s*$/.test(body) || (body.match(/\.{3}|…/g)?.length ?? 0) >= 2);

  const meta = useMemo(() => {
    if (!job) return '';
    const place =
      placeLabel(job.cityId || inferPlaceId(job.location), locale) ||
      formatPlace(job.location, job.remote) ||
      (job.remote ? t('fact.remote') : '');
    return joinMeta([place, formatDate(job.publishedAt, locale)]);
  }, [job, locale, t]);

  const [translated, setTranslated] = useState<JobTextBundle | null>(null);
  const [showTranslated, setShowTranslated] = useState(false);
  const [translating, setTranslating] = useState(false);
  const [translateError, setTranslateError] = useState<string | null>(null);
  const translateAbort = useRef<AbortController | null>(null);

  useEffect(() => {
    translateAbort.current?.abort();
    translateAbort.current = null;
    setTranslated(null);
    setShowTranslated(false);
    setTranslateError(null);
  }, [job?.id, locale]);

  useEffect(() => () => translateAbort.current?.abort(), []);

  const facts = useMemo(() => (job ? jobFacts(job) : []), [job]);
  const sourceText = `${job?.title ?? ''} ${job?.company ?? ''} ${body}`;
  const alreadyLocale = Boolean(sourceText.trim()) && detectTextLocale(sourceText) === locale;

  const onTranslate = useCallback(async () => {
    if (!job) return;
    if (showTranslated) {
      setShowTranslated(false);
      return;
    }
    if (translated) {
      setShowTranslated(true);
      return;
    }
    translateAbort.current?.abort();
    const ac = new AbortController();
    translateAbort.current = ac;
    let timedOut = false;
    const timeout = setTimeout(() => {
      timedOut = true;
      ac.abort();
    }, 50000);
    setTranslating(true);
    setTranslateError(null);
    try {
      const next = await translateJobTexts(
        { title: job.title, company: displayName(job.company), body },
        locale,
        ac.signal,
      );
      if (ac.signal.aborted) return;
      if (needsTranslation(body, locale) && !isSuccessfulTranslation(body, next.body, locale)) {
        setTranslateError(t('job.translateFail'));
        return;
      }
      setTranslated(next);
      setShowTranslated(true);
    } catch (error) {
      if (ac.signal.aborted || (error instanceof Error && error.name === 'AbortError')) {
        if (timedOut) setTranslateError(t('job.translateFail'));
        return;
      }
      const code = translateFailCode(error);
      setTranslateError(
        t(
          code === 'network'
            ? 'job.translateFailNetwork'
            : code === 'quota'
              ? 'job.translateFailQuota'
              : 'job.translateFail',
        ),
      );
    } finally {
      clearTimeout(timeout);
      if (translateAbort.current === ac) setTranslating(false);
    }
  }, [body, job, locale, showTranslated, t, translated]);

  if (!job) {
    return (
      <View style={styles.center}>
        <EmptyState title={t('job.notFound')} subtitle={t('job.notFoundHint')} />
      </View>
    );
  }

  const title = showTranslated && translated ? translated.title : job.title;
  const company = showTranslated && translated ? translated.company : displayName(job.company);
  const text = showTranslated && translated ? translated.body : body;
  const premium = jobTier(job) === 1 && !ownJob?.archived;
  const appJob = jobTier(job) === 2 && !ownJob?.archived;
  const cardTone = ownJob?.archived ? 'default' : toneForTier(jobTier(job));

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={[styles.content, job.url && styles.contentCta]}>
        <ToneCard tone={cardTone} style={styles.hero}>
          <View style={styles.logo}>
            <CompanyLogo
              uri={job.companyLogo || logoFromApplyUrl(job.url)}
              name={company}
              size={80}
              sourceId={job.sourceId}
            />
          </View>
          {premium ? <PremiumBadge /> : null}
          <Text variant="headlineSmall" style={styles.headline}>
            {title}
          </Text>
          <Text variant="bodyMedium" style={styles.company}>
            {company}
          </Text>
        </ToneCard>

        <ChipWrap center style={{ marginBottom: 16 }}>
          {ownJob?.archived ? <AppChip label={t('common.archived')} selected /> : null}
          {job.salary ? <AppChip label={job.salary} selected /> : null}
          {meta ? <AppChip label={meta} quiet /> : null}
          {facts.map((fact) => (
            <AppChip key={fact.id} label={tokenLabel(locale, fact.value)} quiet />
          ))}
          <AppChip label={premium ? t('common.premium') : appJob ? t('common.app') : job.sourceName} selected />
        </ChipWrap>

        {job.contact ? (
          <Text variant="bodyMedium" style={styles.meta}>
            {t('job.contact', { value: job.contact })}
          </Text>
        ) : null}

        <ToneCard tone={cardTone} style={styles.companyCard}>
          <Text variant="titleSmall">{company}</Text>
          <Text variant="bodySmall" style={styles.companyNote}>
            {premium ? t('common.premium') : appJob ? t('common.app') : job.sourceName}
          </Text>
        </ToneCard>

        <Text variant="labelSmall" style={styles.statusTitle}>
          {t('job.status')}
        </Text>
        <ChipWrap style={{ marginBottom: 12 }}>
          {APPLY_STATUSES.map((item) => (
            <SelectChip
              key={item.id}
              id={item.id}
              label={t(keyOf('apply', item.id))}
              compact
              selected={applyStatus === item.id}
              onChange={onStatus}
            />
          ))}
        </ChipWrap>

        {!job.description && isHhJobId(job.id) ? <ActivityIndicator style={{ marginVertical: 16 }} /> : null}

        {text ? <JobBody text={text} /> : null}
        {snippetOnly && !showTranslated && !isLocalJob(job) ? (
          <AppText style={styles.snippetHint}>{t('job.snippet')}</AppText>
        ) : null}
        {translateError ? <AppText style={styles.snippetHint}>{translateError}</AppText> : null}
        {alreadyLocale && !showTranslated ? (
          <AppText style={styles.snippetHint}>{t('job.alreadyLocale')}</AppText>
        ) : null}
        {((!alreadyLocale && Boolean(sourceText.trim())) || showTranslated || translating) ? (
          <Button mode="outlined" onPress={onTranslate} disabled={translating} style={styles.secondary}>
            {translating ? t('job.translating') : showTranslated ? t('job.translateHide') : t('job.translate')}
          </Button>
        ) : null}

        {job.url ? <CopyLinkButton url={job.url} /> : null}
        <Button mode="outlined" onPress={toggle} icon={saved ? 'star' : 'star-outline'} style={styles.secondary}>
          {saved ? t('common.unsave') : t('common.save')}
        </Button>
        {ownJob ? (
          <>
            <Button mode="outlined" onPress={() => router.push(jobCreateHref(ownJob.id))} style={styles.secondary}>
              {t('job.edit')}
            </Button>
            <Button mode="outlined" onPress={onArchive} style={styles.secondary}>
              {ownJob.archived ? t('job.restore') : t('job.archive')}
            </Button>
            <Button mode="text" onPress={onDelete} textColor={colors.danger} style={styles.secondary}>
              {t('job.delete')}
            </Button>
          </>
        ) : applyStatus || isTrackedJob(job) ? (
          <Button mode="outlined" onPress={() => router.push(pipelineAddHref(job.id))} style={styles.secondary}>
            {t('job.edit')}
          </Button>
        ) : null}
      </ScrollView>
      {job.url ? (
        <View style={[styles.ctaBar, { paddingBottom: Math.max(insets.bottom, 12) }]}>
          <Pressable onPress={open} style={({ pressed }) => [styles.cta, pressed && styles.ctaPressed]}>
            <AppText style={styles.ctaText}>{t('job.apply')}</AppText>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

function jobDetailsStyles(colors: ThemeColors, _scheme: ColorSchemeName) {
  return {
    screen: { flex: 1, backgroundColor: colors.bg },
    content: { padding: 20, paddingBottom: 48 },
    contentCta: { paddingBottom: 24 },
    center: { flex: 1, backgroundColor: colors.bg, justifyContent: 'center' as const, padding: 24 },
    hero: {
      alignItems: 'center' as const,
      marginBottom: 16,
      paddingHorizontal: 16,
      paddingVertical: 20,
      borderRadius: radius.xl,
      gap: 8,
    },
    logo: { marginBottom: 16 },
    headline: { textAlign: 'center' as const },
    company: { marginTop: 6, opacity: 0.75, textAlign: 'center' as const },
    meta: { marginTop: 8, opacity: 0.85 },
    companyCard: {
      padding: 16,
      marginTop: 8,
      marginBottom: 16,
      gap: 4,
    },
    companyNote: { opacity: 0.65 },
    statusTitle: { marginTop: 8, marginBottom: 8, opacity: 0.7 },
    snippetHint: {
      color: colors.faint,
      fontFamily: fonts.medium,
      fontSize: 13,
      lineHeight: 18,
      marginBottom: 8,
    },
    secondary: { marginTop: 10, borderRadius: radius.full },
    ctaBar: {
      paddingHorizontal: 20,
      paddingTop: 12,
      backgroundColor: colors.glass,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.cardBorder,
    },
    cta: {
      backgroundColor: colors.accent,
      borderRadius: radius.full,
      paddingVertical: 16,
      alignItems: 'center' as const,
    },
    ctaPressed: { opacity: 0.9 },
    ctaText: { color: colors.accentText, fontFamily: fonts.bold, fontSize: 16 },
  };
}

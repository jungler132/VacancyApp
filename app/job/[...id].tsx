import { useLocalSearchParams, useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ActivityIndicator, Button, Text } from 'react-native-paper';

import { AppChip } from '@/components/AppChip';
import { ChipWrap } from '@/components/ChipWrap';
import { CopyLinkButton } from '@/components/CopyLinkButton';
import { EmptyState } from '@/components/EmptyState';
import { SelectChip } from '@/components/FilterChips';
import { CompanyLogo } from '@/components/CompanyLogo';
import { requestInterstitial } from '@/lib/ads';
import { APPLY_STATUSES, type ApplyStatus } from '@/lib/apply';
import { displayName, formatDate, formatPlace, htmlToText, joinMeta, jobFacts } from '@/lib/format';
import { Text as AppText } from '@/components/AppText';
import { JobBody } from '@/components/JobBody';
import { keyOf, tokenLabel } from '@/lib/i18n';
import { logoFromApplyUrl } from '@/lib/logo';
import { useLocale, useT } from '@/lib/i18n/useT';
import { detectTextLocale, translateJobTexts, type JobTextBundle } from '@/lib/translate';
import { useAppDispatch, useAppSelector } from '@/lib/store/hooks';
import { isHhJobId } from '@/lib/api/providers/hh';
import { hydrateJob } from '@/lib/store/jobsSlice';
import { removeLocalJob } from '@/lib/store/localJobsSlice';
import { matchRouteJobId, parseJobIdParam } from '@/lib/jobRoute';
import { selectIsSaved, selectJobById, selectViewedJob } from '@/lib/store/selectors';
import { setApplyStatus, toggleSaved } from '@/lib/store/savedSlice';
import { isLocalJob, jobTier } from '@/lib/tiers';
import { fonts, radius, shadowsFor, useColors, useThemedStyles, type ColorSchemeName, type ThemeColors } from '@/lib/theme';

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

  const body = useMemo(() => htmlToText(job?.description || job?.excerpt || ''), [job?.description, job?.excerpt]);
  const snippetOnly = Boolean(body) && (body.replace(/\s+/g, ' ').length < 480 || /(?:\.{3}|…)\s*$/.test(body) || (body.match(/\.{3}|…/g)?.length ?? 0) >= 2);

  const meta = useMemo(() => {
    if (!job) return '';
    const place = formatPlace(job.location, job.remote) || (job.remote ? t('fact.remote') : '');
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
    setTranslating(true);
    setTranslateError(null);
    try {
      const next = await translateJobTexts(
        { title: job.title, company: displayName(job.company), body },
        locale,
        ac.signal,
      );
      if (ac.signal.aborted) return;
      setTranslated(next);
      setShowTranslated(true);
    } catch (error) {
      if (ac.signal.aborted || (error instanceof Error && error.name === 'AbortError')) return;
      setTranslateError(t('job.translateFail'));
    } finally {
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

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={[styles.content, job.url && styles.contentCta]}>
        <View style={styles.hero}>
          <View style={styles.logo}>
            <CompanyLogo uri={job.companyLogo || logoFromApplyUrl(job.url)} name={company} size={80} />
          </View>
          <Text variant="headlineSmall" style={styles.headline}>
            {title}
          </Text>
          <Text variant="bodyMedium" style={styles.company}>
            {company}
          </Text>
        </View>

        <ChipWrap center style={{ marginBottom: 16 }}>
          {job.salary ? <AppChip label={job.salary} selected /> : null}
          {meta ? <AppChip label={meta} /> : null}
          {facts.map((fact) => (
            <AppChip key={fact.id} label={tokenLabel(locale, fact.value)} />
          ))}
          <AppChip label={jobTier(job) === 1 ? t('common.premium') : job.sourceName} selected />
        </ChipWrap>

        {job.contact ? (
          <Text variant="bodyMedium" style={styles.meta}>
            {t('job.contact', { value: job.contact })}
          </Text>
        ) : null}

        <View style={styles.companyCard}>
          <Text variant="titleSmall">{company}</Text>
          <Text variant="bodySmall" style={styles.companyNote}>
            {job.sourceName}
          </Text>
        </View>

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
        {snippetOnly && !showTranslated ? (
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
        {isLocalJob(job) ? (
          <Button mode="text" onPress={onDelete} textColor={colors.danger} style={styles.secondary}>
            {t('job.delete')}
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

function jobDetailsStyles(colors: ThemeColors, scheme: ColorSchemeName) {
  return {
    screen: { flex: 1, backgroundColor: colors.bg },
    content: { padding: 20, paddingBottom: 48 },
    contentCta: { paddingBottom: 24 },
    center: { flex: 1, backgroundColor: colors.bg, justifyContent: 'center' as const, padding: 24 },
    hero: { alignItems: 'center' as const, marginBottom: 16 },
    logo: { marginBottom: 16 },
    headline: { textAlign: 'center' as const },
    company: { marginTop: 6, opacity: 0.75, textAlign: 'center' as const },
    meta: { marginTop: 8, opacity: 0.85 },
    companyCard: {
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.cardBorder,
      borderRadius: radius.lg,
      padding: 16,
      marginTop: 8,
      marginBottom: 16,
      gap: 4,
      ...shadowsFor(scheme).card,
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

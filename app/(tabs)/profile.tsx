import { useCallback, useMemo } from 'react';
import { Linking, Pressable, ScrollView, View } from 'react-native';
import type { Href } from 'expo-router';

import { AppHeader } from '@/components/AppHeader';
import { NavRow } from '@/components/NavRow';
import { PlanSwitch } from '@/components/PlanSwitch';
import { PremiumBadge } from '@/components/PremiumBadge';
import { ServiceAvatar } from '@/components/ServiceAvatar';
import { Text } from '@/components/AppText';
import { alertLabel } from '@/lib/alerts';
import { keyOf } from '@/lib/i18n';
import { useLocale, useT } from '@/lib/i18n/useT';
import { useLockedNav } from '@/lib/hooks/useLockedNav';
import { jobHref } from '@/lib/jobRoute';
import { useTabBarLayout } from '@/lib/layout';
import { pipelineStats } from '@/lib/pipeline';
import { prefsFilled, searchFromPrefs } from '@/lib/prefs';
import { offerEditorHref, offerViewHref, COMPANY_ME_HREF, PIPELINE_HREF, PREFS_HREF, SAVED_HREF, SERVICE_ME_HREF, STATS_HREF, TODAY_HREF } from '@/lib/services/catalog';
import { jobTier } from '@/lib/tiers';
import { collectNewJobs } from '@/lib/today';
import { applySearch } from '@/lib/store/filtersSlice';
import { pinViewedJob, setTodayJobs } from '@/lib/store/jobsSlice';
import { clearPendingNew } from '@/lib/store/alertsSlice';
import { openPaywall } from '@/lib/store/premiumSlice';
import { clearVisits, recordVisit, removeVisit } from '@/lib/store/visitsSlice';
import { useAppDispatch, useAppSelector, useAppStore } from '@/lib/store/hooks';
import { selectOwnMaster, selectTodayCard } from '@/lib/store/selectors';
import { ToneCard } from '@/components/ToneCard';
import { fonts, radius, shadowsFor, useThemedStyles, type ColorSchemeName, type ThemeColors } from '@/lib/theme';

const JOBS_HREF = '/' as Href;

export default function ProfileScreen() {
  const nav = useLockedNav();
  const dispatch = useAppDispatch();
  const store = useAppStore();
  const t = useT();
  const styles = useThemedStyles(profileStyles);
  const tabBar = useTabBarLayout();
  const own = useAppSelector(selectOwnMaster);
  const company = useAppSelector((state) => state.company);
  const isPremium = useAppSelector((state) => state.premium.isPremium);
  const signedIn = useAppSelector((state) => Boolean(state.auth.userId && state.auth.email && !state.auth.anonymous));
  const showPremium = isPremium && signedIn;
  const locale = useLocale();
  const identity = useAppSelector((state) => state.identity);
  const seeking = identity.seeking;
  const available = identity.available;
  const savedJobs = useAppSelector((state) => state.saved.items);
  const statuses = useAppSelector((state) => state.saved.statuses);
  const statusAt = useAppSelector((state) => state.saved.statusAt);
  const digest = useAppSelector(selectTodayCard);
  const savedJobCount = savedJobs.length;
  const savedResources = useAppSelector((state) => state.savedCatalog.items.length);
  const savedServices = useAppSelector((state) => state.savedServices.items.length);
  const localJobs = useAppSelector((state) => state.localJobs.items);
  const visits = useAppSelector((state) => state.visits.items);
  const hasPage = Boolean(own?.displayName.trim());
  const name = own?.displayName.trim() || t('common.guest');
  const frequent = useMemo(() => visits.slice(0, 4), [visits]);
  const stats = useMemo(() => pipelineStats(savedJobs, statuses, statusAt), [savedJobs, statusAt, statuses]);
  const prefsMeta =
    [
      identity.title.trim() || null,
      seeking ? t('identity.seeking') : null,
      available ? t('identity.available') : null,
      identity.format !== 'any' ? t(keyOf('filters.format', identity.format)) : null,
    ]
      .filter(Boolean)
      .join(' · ') || t('prefs.empty');
  const newLabel = digest.alert ? alertLabel(digest.alert, locale) : identity.title.trim();
  const newText = digest.newCount
    ? digest.alertCount > 1
      ? t('today.newMany', { count: digest.newCount })
      : newLabel
        ? t('today.new', { count: digest.newCount, label: newLabel })
        : t('today.newYou', { count: digest.newCount })
    : null;
  const showToday = seeking || digest.newCount > 0 || digest.moves > 0 || Boolean(digest.staleJob);
  const role = [
    seeking ? t('identity.seeking') : null,
    available ? t('identity.available') : null,
    showPremium ? t('common.premium') : null,
  ]
    .filter(Boolean)
    .join(' · ') || t('common.guest');
  const pageMeta = hasPage
    ? t('profile.pageMeta', { count: own?.offers.length ?? 0 })
    : t('profile.pageEmpty');
  const summary = stats.total
    ? t('pipeline.summary', {
        total: stats.total,
        replies: stats.replies,
        source: stats.bestSource ?? t('pipeline.noSource'),
      })
    : t('pipeline.empty');

  const openVisit = useCallback(
    (item: (typeof frequent)[number]) => {
      dispatch(recordVisit({ id: item.id, title: item.title, url: item.url, kind: item.kind }));
      Linking.openURL(item.url).catch(() => undefined);
    },
    [dispatch],
  );

  const openPage = useCallback(() => nav.push(SERVICE_ME_HREF), [nav]);
  const openNewOffer = useCallback(() => {
    nav.push(hasPage ? offerEditorHref('new') : SERVICE_ME_HREF);
  }, [hasPage, nav]);
  const openNewJobs = useCallback(() => {
    const state = store.getState();
    const jobs = collectNewJobs({
      alerts: state.alerts.items,
      jobsById: state.jobs.byId,
      savedJobs: state.saved.items,
      prefs: state.identity,
    });
    if (jobs.length) {
      dispatch(setTodayJobs(jobs));
      for (const item of state.alerts.items) {
        if (item.pendingNew || item.pendingNewIds?.length) dispatch(clearPendingNew(item.id));
      }
      nav.push(TODAY_HREF);
      return;
    }
    if (digest.alert) {
      dispatch(applySearch(digest.alert));
      nav.push(JOBS_HREF);
      return;
    }
    if (prefsFilled(identity)) {
      dispatch(applySearch(searchFromPrefs(identity)));
      nav.push(JOBS_HREF);
    }
  }, [digest.alert, dispatch, identity, nav, store]);
  const openTodayEmpty = useCallback(() => {
    if (prefsFilled(identity)) {
      dispatch(applySearch(searchFromPrefs(identity)));
      nav.push(JOBS_HREF);
      return;
    }
    nav.push(PREFS_HREF);
  }, [dispatch, identity, nav]);
  const openTodayStale = useCallback(() => {
    const job = savedJobs.find((item) => item.id === digest.staleJob?.id);
    if (!job) return;
    dispatch(pinViewedJob(job));
    nav.push(jobHref(job.id));
  }, [digest.staleJob, dispatch, nav, savedJobs]);

  return (
    <View style={styles.screen}>
      <AppHeader title={t('tab.profile')} />
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: tabBar.listPaddingBottom }]}>
        <ToneCard tone={showPremium ? 'premium' : 'default'} onPress={openPage} style={styles.head}>
          <ServiceAvatar uri={own?.avatarUri} name={name} size={80} />
          <View style={styles.nameRow}>
            <Text style={styles.name}>{name}</Text>
            {showPremium ? <PremiumBadge compact /> : null}
          </View>
          <Text style={styles.role}>{role}</Text>
          <Text style={styles.meta}>{own?.bio?.trim() || t('profile.guestMeta')}</Text>
        </ToneCard>

        <NavRow title={t('nav.prefs')} meta={prefsMeta} onPress={() => nav.push(PREFS_HREF)} />

        {showToday ? (
          <View style={styles.today}>
            <Text style={styles.todayTitle}>{t('today.title')}</Text>
            {newText ? (
              <Pressable onPress={openNewJobs} style={({ pressed }) => pressed && styles.pressed}>
                <Text style={styles.todayLine}>{newText}</Text>
              </Pressable>
            ) : null}
            {digest.moves ? (
              <Pressable onPress={() => nav.push(PIPELINE_HREF)} style={({ pressed }) => pressed && styles.pressed}>
                <Text style={styles.todayLine}>{t('today.moves', { count: digest.moves })}</Text>
              </Pressable>
            ) : null}
            {digest.staleJob ? (
              <Pressable onPress={openTodayStale} style={({ pressed }) => pressed && styles.pressed}>
                <Text style={styles.todayLine}>
                  {t('today.stale', { title: digest.staleJob.title, days: digest.staleJob.ageDays })}
                </Text>
              </Pressable>
            ) : null}
            {!newText && !digest.moves && !digest.staleJob ? (
              <Pressable onPress={openTodayEmpty} style={({ pressed }) => pressed && styles.pressed}>
                <Text style={styles.todayEmpty}>{t(prefsFilled(identity) ? 'today.emptyFeed' : 'today.empty')}</Text>
              </Pressable>
            ) : null}
          </View>
        ) : null}

        <Text style={styles.section}>{t('pipeline.titleSection')}</Text>
        <NavRow title={t('nav.pipeline')} meta={summary} onPress={() => nav.push(PIPELINE_HREF)} />

        <View style={styles.rowBetween}>
          <Text style={styles.section}>{t('profile.work')}</Text>
          <Pressable onPress={openNewOffer} hitSlop={8}>
            <Text style={styles.link}>{t('profile.addService')}</Text>
          </Pressable>
        </View>
        {own?.offers.length ? (
          own.offers.map((offer) => (
            <NavRow
              key={offer.id}
              title={offer.title}
              meta={[
                offer.archived ? t('common.archived') : '',
                offer.featured && !offer.archived ? t('common.premium') : '',
                offer.price ? `${offer.price} ${offer.currency}` : t('services.priceNegotiable'),
              ]
                .filter(Boolean)
                .join(' · ')}
              premium={Boolean(offer.featured && !offer.archived)}
              muted={offer.archived}
              onPress={() => nav.push(offerViewHref(offer.id))}
            />
          ))
        ) : (
          <Text style={styles.empty}>{available ? t('me.emptyOffers') : t('identity.servicesOff')}</Text>
        )}

        <Text style={styles.section}>{t('identity.more')}</Text>
        <NavRow
          title={t('nav.saved')}
          meta={t('saved.subtitle', { jobs: savedJobCount, services: savedServices, resources: savedResources })}
          onPress={() => nav.push(SAVED_HREF)}
        />
        <NavRow title={t('nav.stats')} meta={t('profile.statsMeta')} onPress={() => nav.push(STATS_HREF)} />
        <NavRow title={t('profile.servicePage')} meta={pageMeta} onPress={openPage} />
        <NavRow
          title={t('profile.companyPage')}
          meta={company.name.trim() ? t('profile.companyMeta') : t('profile.companyEmpty')}
          onPress={() => nav.push(COMPANY_ME_HREF)}
        />
        <PlanSwitch
          premium={isPremium}
          onBasic={() => undefined}
          onPremium={() => dispatch(openPaywall())}
        />

        <View style={styles.rowBetween}>
          <Text style={styles.section}>{t('profile.jobs')}</Text>
          <Pressable onPress={() => nav.push('/job/create')} hitSlop={8}>
            <Text style={styles.link}>{t('profile.create')}</Text>
          </Pressable>
        </View>
        {localJobs.length ? (
          [...localJobs]
            .sort((a, b) => Number(Boolean(a.archived)) - Number(Boolean(b.archived)))
            .map((job) => (
            <NavRow
              key={job.id}
              title={job.title}
              meta={[
                job.archived ? t('common.archived') : '',
                job.company,
                jobTier(job) === 1 ? t('profile.jobPremium') : t('common.workly'),
              ]
                .filter(Boolean)
                .join(' · ')}
              premium={jobTier(job) === 1 && !job.archived}
              workly={jobTier(job) === 2 && !job.archived}
              muted={job.archived}
              onPress={() => {
                dispatch(pinViewedJob(job));
                nav.push(jobHref(job.id));
              }}
            />
          ))
        ) : (
          <Text style={styles.empty}>{t('profile.jobsEmpty')}</Text>
        )}

        <View style={styles.rowBetween}>
          <Text style={styles.section}>{t('profile.activity')}</Text>
          {frequent.length ? (
            <Pressable onPress={() => dispatch(clearVisits())} hitSlop={8}>
              <Text style={styles.link}>{t('profile.clearVisits')}</Text>
            </Pressable>
          ) : null}
        </View>
        {frequent.length ? (
          frequent.map((item) => (
            <NavRow
              key={item.id}
              title={item.title}
              meta={t('profile.opens', { count: item.count })}
              onPress={() => openVisit(item)}
              onClear={() => dispatch(removeVisit(item.id))}
              clearLabel={t('profile.removeVisit')}
            />
          ))
        ) : (
          <Text style={styles.empty}>{t('profile.visitsEmpty')}</Text>
        )}
      </ScrollView>
    </View>
  );
}

function profileStyles(colors: ThemeColors, scheme: ColorSchemeName) {
  return {
    screen: { flex: 1, backgroundColor: 'transparent' },
    content: { padding: 16, gap: 8, paddingBottom: 24 },
    head: {
      alignItems: 'center' as const,
      paddingVertical: 24,
      paddingHorizontal: 16,
      marginBottom: 4,
    },
    nameRow: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 8, marginTop: 12 },
    name: { color: colors.text, fontFamily: fonts.bold, fontSize: 22, textAlign: 'center' as const },
    role: { color: colors.accent, fontFamily: fonts.semibold, fontSize: 13, marginTop: 4, textAlign: 'center' as const },
    meta: {
      color: colors.faint,
      fontFamily: fonts.medium,
      fontSize: 13,
      marginTop: 8,
      lineHeight: 18,
      textAlign: 'center' as const,
    },
    section: {
      color: colors.muted,
      fontFamily: fonts.semibold,
      fontSize: 12,
      letterSpacing: 0.4,
      textTransform: 'uppercase' as const,
      marginTop: 12,
      marginBottom: 4,
    },
    rowBetween: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'space-between' as const,
      marginTop: 8,
    },
    link: { color: colors.accent, fontFamily: fonts.semibold, fontSize: 14 },
    empty: { color: colors.faint, fontFamily: fonts.medium, fontSize: 13, marginBottom: 4 },
    pressed: { opacity: 0.86 },
    today: {
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.cardBorder,
      borderRadius: radius.lg,
      paddingHorizontal: 16,
      paddingVertical: 14,
      marginBottom: 4,
      ...shadowsFor(scheme).card,
    },
    todayTitle: { color: colors.accent, fontFamily: fonts.semibold, fontSize: 13 },
    todayLine: { color: colors.text, fontFamily: fonts.medium, fontSize: 14, lineHeight: 20, marginTop: 6 },
    todayEmpty: { color: colors.faint, fontFamily: fonts.medium, fontSize: 13, lineHeight: 18, marginTop: 6 },
  };
}

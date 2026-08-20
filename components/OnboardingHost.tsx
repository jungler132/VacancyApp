import { memo, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Modal, Pressable, ScrollView, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import PagerView from 'react-native-pager-view';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MaterialDesignIcons from '@react-native-vector-icons/material-design-icons';

import { CreateJobButton } from '@/components/CreateJobButton';
import { FilterIconButton } from '@/components/AppHeader';
import { CatalogLinkCard } from '@/components/CatalogLinkCard';
import { JobCardView } from '@/components/JobCard';
import { NavRow } from '@/components/NavRow';
import { SearchField } from '@/components/SearchField';
import { ServiceAvatar } from '@/components/ServiceAvatar';
import { ServiceMasterCard } from '@/components/ServiceMasterCard';
import { Text } from '@/components/AppText';
import { ToneCard } from '@/components/ToneCard';
import type { MsgId } from '@/lib/i18n';
import { useT } from '@/lib/i18n/useT';
import { DEFAULT_HOURS } from '@/lib/services/hours';
import { filterServiceMasters } from '@/lib/services/catalog';
import type { ServiceKindId, ServiceMaster, ServiceOffer } from '@/lib/services/types';
import { dismissOnboarding, hideOnboarding } from '@/lib/store/onboardingSlice';
import { useAppDispatch, useAppSelector } from '@/lib/store/hooks';
import { TELEGRAM_GROUPS, JOB_SITES } from '@/lib/telegramGroups';
import { fonts, radius, useAppTheme, useThemedStyles, type ThemeColors } from '@/lib/theme';
import type { Job } from '@/lib/types';

type TabGlyph = 'magnify' | 'briefcase-account' | 'book-open-variant' | 'account' | 'cog';
type StepVisualId = 'tabs' | 'jobs' | 'services' | 'resources' | 'profile' | 'settings';

const TABS: { icon: TabGlyph; label: MsgId; hint: MsgId }[] = [
  { icon: 'magnify', label: 'tab.jobs', hint: 'onboard.tabJobsHint' },
  { icon: 'briefcase-account', label: 'tab.services', hint: 'onboard.tabServicesHint' },
  { icon: 'book-open-variant', label: 'tab.resources', hint: 'onboard.tabResourcesHint' },
  { icon: 'account', label: 'tab.profile', hint: 'onboard.tabProfileHint' },
  { icon: 'cog', label: 'tab.settings', hint: 'onboard.tabSettingsHint' },
];

const STEPS: { title: MsgId; body: MsgId; visual: StepVisualId }[] = [
  { title: 'onboard.tabsTitle', body: 'onboard.tabsBody', visual: 'tabs' },
  { title: 'onboard.jobsTitle', body: 'onboard.jobsBody', visual: 'jobs' },
  { title: 'onboard.servicesTitle', body: 'onboard.servicesBody', visual: 'services' },
  { title: 'onboard.resourcesTitle', body: 'onboard.resourcesBody', visual: 'resources' },
  { title: 'onboard.profileTitle', body: 'onboard.profileBody', visual: 'profile' },
  { title: 'onboard.settingsTitle', body: 'onboard.settingsBody', visual: 'settings' },
];

const noop = () => undefined;

function mockJob(job: Partial<Job> & Pick<Job, 'id' | 'title' | 'company'>): Job {
  return {
    sourceId: 'hh',
    sourceName: 'HeadHunter',
    location: '',
    remote: false,
    url: 'https://vakano.app',
    excerpt: '',
    ...job,
  };
}

function mockOffer(
  id: string,
  profileId: string,
  title: string,
  kind: ServiceKindId,
  featured = false,
): ServiceOffer {
  return {
    id,
    profileId,
    title,
    description: '',
    currency: 'AZN',
    images: [],
    kind,
    featured,
    updatedAt: '2026-01-01',
  };
}

function mockMaster(
  id: string,
  displayName: string,
  kinds: ServiceKindId[],
  cityId: string,
  offers: ServiceOffer[],
): ServiceMaster {
  return {
    id,
    displayName,
    bio: '',
    photos: [],
    email: '',
    phone: '',
    kinds,
    customKinds: [],
    cityId,
    hours: DEFAULT_HOURS,
    updatedAt: '2026-01-01',
    offers,
  };
}

function TabGlyphView({ name, active }: { name: TabGlyph; active: boolean }) {
  const { colors } = useAppTheme();
  const styles = useThemedStyles(onboardStyles);
  return (
    <View style={styles.iconWrap}>
      {active ? <View pointerEvents="none" style={styles.iconPill} /> : null}
      <MaterialDesignIcons name={name} color={active ? colors.accent : colors.faint} size={22} />
    </View>
  );
}

function MockTabBar({ active }: { active: TabGlyph }) {
  const t = useT();
  const { colors } = useAppTheme();
  const styles = useThemedStyles(onboardStyles);
  return (
    <View style={styles.tabBar}>
      {TABS.map((tab) => {
        const focused = tab.icon === active;
        return (
          <View key={tab.icon} style={styles.tabBarItem}>
            <TabGlyphView name={tab.icon} active={focused} />
            <Text
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.5}
              allowFontScaling={false}
              style={[styles.tabBarLabel, { color: focused ? colors.accent : colors.faint }]}>
              {t(tab.label)}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

function MockPhone({
  active,
  interactive,
  children,
}: {
  active: TabGlyph;
  interactive?: boolean;
  children: ReactNode;
}) {
  const styles = useThemedStyles(onboardStyles);
  return (
    <View style={styles.phone}>
      <View pointerEvents={interactive ? 'box-none' : 'none'} style={styles.feed}>
        {children}
      </View>
      <View pointerEvents="none">
        <MockTabBar active={active} />
      </View>
    </View>
  );
}

function ResourcesPreview() {
  const t = useT();
  const styles = useThemedStyles(onboardStyles);
  const [page, setPage] = useState<'telegram' | 'sites'>('telegram');
  const telegram = page === 'telegram';
  const items = telegram ? TELEGRAM_GROUPS.slice(0, 3) : JOB_SITES.slice(0, 3);
  const total = telegram ? TELEGRAM_GROUPS.length : JOB_SITES.length;

  return (
    <MockPhone active="book-open-variant" interactive>
      <View pointerEvents="none" style={styles.mockHeader}>
        <View style={styles.titles}>
          <Text style={styles.mockTitle}>{t('tab.resources')}</Text>
          <Text style={styles.subtitle}>{t('resources.subtitle', { visible: items.length, total })}</Text>
        </View>
      </View>
      <View style={styles.segment}>
        <Pressable
          onPress={() => setPage('telegram')}
          style={[styles.seg, telegram && styles.segOn]}
          android_ripple={null}>
          <Text style={telegram ? styles.segOnText : styles.segText}>{t('saved.telegram')}</Text>
        </Pressable>
        <Pressable
          onPress={() => setPage('sites')}
          style={[styles.seg, !telegram && styles.segOn]}
          android_ripple={null}>
          <Text style={!telegram ? styles.segOnText : styles.segText}>{t('saved.sites')}</Text>
        </Pressable>
      </View>
      <View pointerEvents="none" style={styles.list}>
        {items.map((item) => (
          <CatalogLinkCard key={item.id} item={item} telegram={telegram} />
        ))}
      </View>
    </MockPhone>
  );
}

function SearchRow({ placeholder }: { placeholder: string }) {
  const styles = useThemedStyles(onboardStyles);
  return (
    <View style={styles.searchRow}>
      <View style={styles.search}>
        <SearchField value="" onSearch={noop} placeholder={placeholder} />
      </View>
      <FilterIconButton active={false} onPress={noop} />
    </View>
  );
}

function StepVisual({ visual }: { visual: StepVisualId }) {
  const t = useT();
  const { colors } = useAppTheme();
  const styles = useThemedStyles(onboardStyles);
  const jobs = useMemo(
    () => [
      mockJob({
        id: 'onboard-job-1',
        title: t('onboard.jobsMockTitle'),
        company: t('onboard.jobsMockCompany'),
        remote: true,
        salary: '$2,800–3,400',
        tier: 2,
        sourceName: 'Vakano',
        sourceId: 'vakano',
        schedule: 'remote',
      }),
      mockJob({
        id: 'onboard-job-2',
        title: t('onboard.jobsMockTitle2'),
        company: t('onboard.jobsMockCompany2'),
        cityId: 'baku',
        location: 'Baku',
        salary: '900–1,200 AZN',
        sourceName: 'Jooble',
        sourceId: 'jooble',
      }),
      mockJob({
        id: 'onboard-job-3',
        title: t('onboard.jobsMockTitle3'),
        company: t('onboard.jobsMockCompany3'),
        cityId: 'moscow',
        location: 'Moscow',
        salary: '80 000 ₽',
        employment: 'full',
      }),
    ],
    [t],
  );
  const masters = useMemo(
    () =>
      filterServiceMasters(
        [
          mockMaster('onboard-m1', t('onboard.servicesMockName'), ['tutoring'], 'baku', [
            mockOffer('onboard-o1', 'onboard-m1', t('onboard.servicesMockKind'), 'tutoring'),
            mockOffer('onboard-o1b', 'onboard-m1', 'IELTS', 'tutoring'),
          ]),
          mockMaster('onboard-m2', t('onboard.servicesMockName2'), ['repair'], 'baku', [
            mockOffer('onboard-o2', 'onboard-m2', t('onboard.servicesMockKind2'), 'repair'),
            mockOffer('onboard-o2b', 'onboard-m2', t('kind.repair'), 'repair'),
            mockOffer('onboard-o2c', 'onboard-m2', t('kind.it_help'), 'it_help'),
          ]),
          mockMaster('onboard-m3', t('onboard.servicesMockName3'), ['beauty'], 'baku', [
            mockOffer('onboard-o3', 'onboard-m3', t('onboard.servicesMockKind3'), 'beauty', true),
          ]),
        ],
        '',
        'all',
      ),
    [t],
  );

  if (visual === 'tabs') {
    return (
      <MockPhone active="magnify">
        <View style={styles.tabList}>
          {TABS.map((tab) => (
            <View key={tab.icon} style={styles.tabLine}>
              <TabGlyphView name={tab.icon} active={false} />
              <Text style={styles.tabLineText}>
                <Text style={styles.tabName}>{t(tab.label)}</Text>
                <Text style={styles.tabHint}> — {t(tab.hint)}</Text>
              </Text>
            </View>
          ))}
          <View style={styles.note}>
            <Text style={styles.noteText}>{t('onboard.tabsGuest')}</Text>
          </View>
          <View style={styles.note}>
            <Text style={styles.noteText}>{t('onboard.tabsAds')}</Text>
          </View>
        </View>
      </MockPhone>
    );
  }

  if (visual === 'jobs') {
    return (
      <MockPhone active="magnify">
        <View style={styles.mockHeader}>
          <Text style={styles.mockTitle}>{t('tab.jobs')}</Text>
          <View style={styles.mockActions}>
            <CreateJobButton />
            <MaterialDesignIcons name="refresh" size={20} color={colors.muted} />
          </View>
        </View>
        <SearchRow placeholder={t('search.jobs')} />
        <View style={styles.banner}>
          <Text style={styles.bannerTitle}>{t('onboard.publishTitle')}</Text>
          <Text style={styles.bannerMeta}>{t('onboard.publishJob')}</Text>
          <Text style={styles.bannerMeta}>{t('onboard.publishService')}</Text>
        </View>
        <View style={styles.list}>
          {jobs.map((job) => (
            <JobCardView key={job.id} job={job} saved={false} />
          ))}
        </View>
      </MockPhone>
    );
  }

  if (visual === 'services') {
    return (
      <MockPhone active="briefcase-account">
        <View style={styles.mockHeader}>
          <View style={styles.titles}>
            <Text style={styles.mockTitle}>{t('tab.services')}</Text>
            <Text style={styles.subtitle}>{t('services.subtitle', { count: masters.length })}</Text>
          </View>
        </View>
        <SearchRow placeholder={t('search.services')} />
        <View style={styles.banner}>
          <Text style={styles.bannerTitle}>{t('services.createTitle')}</Text>
          <Text style={styles.bannerMeta}>{t('services.createMeta')}</Text>
        </View>
        <View style={styles.serviceList}>
          {masters.map((master) => (
            <ServiceMasterCard key={master.id} master={master} onPress={noop} />
          ))}
        </View>
      </MockPhone>
    );
  }

  if (visual === 'resources') {
    return <ResourcesPreview />;
  }

  if (visual === 'profile') {
    return (
      <MockPhone active="account">
        <View style={styles.mockHeader}>
          <Text style={styles.mockTitle}>{t('tab.profile')}</Text>
        </View>
        <View style={styles.profilePad}>
          <ToneCard style={styles.profileHead}>
            <ServiceAvatar name={t('common.guest')} size={64} />
            <Text style={styles.profileName}>{t('common.guest')}</Text>
            <Text style={styles.profileRole}>{t('common.guest')}</Text>
            <Text style={styles.profileMeta}>{t('profile.guestMeta')}</Text>
          </ToneCard>
          <NavRow title={t('nav.prefs')} meta={t('prefs.empty')} onPress={noop} />
          <Text style={styles.sectionLabel}>{t('pipeline.titleSection')}</Text>
          <NavRow title={t('nav.pipeline')} meta={t('pipeline.empty')} onPress={noop} />
          <View style={styles.kanbanBox}>
            <View style={styles.sectionHead}>
              <Text style={styles.sectionTitle}>{t('apply.applied')}</Text>
              <Text style={styles.sectionCount}>1</Text>
            </View>
            <ToneCard style={styles.pipelineCard}>
              <MaterialDesignIcons name="drag" size={20} color={colors.faint} />
              <View style={styles.miniCopy}>
                <Text style={styles.miniTitle}>{t('onboard.kanbanCard1')}</Text>
                <Text style={styles.miniMeta}>Acme · {t('common.app')}</Text>
              </View>
            </ToneCard>
            <View style={styles.sectionHead}>
              <Text style={styles.sectionTitle}>{t('apply.interview')}</Text>
              <Text style={styles.sectionCount}>1</Text>
            </View>
            <ToneCard style={styles.pipelineCard}>
              <MaterialDesignIcons name="drag" size={20} color={colors.faint} />
              <View style={styles.miniCopy}>
                <Text style={styles.miniTitle}>{t('onboard.kanbanCard2')}</Text>
                <Text style={styles.miniMeta}>Nova · HeadHunter</Text>
              </View>
            </ToneCard>
          </View>
          <View style={styles.rowBetween}>
            <Text style={styles.sectionLabel}>{t('profile.work')}</Text>
            <Text style={styles.link}>{t('profile.addService')}</Text>
          </View>
          <NavRow title={t('onboard.profilePage')} meta={t('profile.pageEmpty')} onPress={noop} />
          <NavRow title={t('onboard.profileCompany')} meta={t('profile.companyEmpty')} onPress={noop} />
        </View>
      </MockPhone>
    );
  }

  return (
    <MockPhone active="cog">
      <View style={styles.mockHeader}>
        <Text style={styles.mockTitle}>{t('tab.settings')}</Text>
      </View>
      <View style={styles.profilePad}>
        <Text style={styles.sectionLabel}>{t('settings.look')}</Text>
        <NavRow title={t('settings.language')} meta={`${t('lang.ru')} · ${t('lang.en')} · ${t('lang.az')}`} onPress={noop} />
        <NavRow title={t('settings.theme')} meta={`${t('theme.system')} · ${t('theme.light')} · ${t('theme.dark')}`} onPress={noop} />
        <NavRow title={t('settings.font')} meta={`${t('font.sm')} · ${t('font.md')} · ${t('font.lg')}`} onPress={noop} />
        <NavRow title={t('settings.sources')} meta={t('onboard.settingsSources')} onPress={noop} />
        <Text style={styles.sectionLabel}>{t('auth.section')}</Text>
        <NavRow title={t('auth.section')} meta={t('onboard.settingsAccount')} onPress={noop} />
        <Text style={styles.sectionLabel}>{t('settings.feedback')}</Text>
        <NavRow title={t('settings.feedback')} meta={t('settings.privacy')} onPress={noop} />
      </View>
    </MockPhone>
  );
}

export const OnboardingHost = memo(function OnboardingHost() {
  const dispatch = useAppDispatch();
  const t = useT();
  const insets = useSafeAreaInsets();
  const { scheme, colors } = useAppTheme();
  const styles = useThemedStyles(onboardStyles);
  const pager = useRef<PagerView>(null);
  const appearanceReady = useAppSelector((state) => state.appearance.ready);
  const onboard = useAppSelector((state) => state.onboarding);
  const [step, setStep] = useState(0);
  const [hideNext, setHideNext] = useState(false);
  const last = step >= STEPS.length - 1;
  const open = appearanceReady && onboard.ready && !onboard.dismissed;

  useEffect(() => {
    if (!open) return;
    setStep(0);
    setHideNext(false);
    pager.current?.setPage(0);
  }, [open]);

  const goTo = useCallback((next: number) => {
    const index = Math.max(0, Math.min(STEPS.length - 1, next));
    pager.current?.setPage(index);
    setStep(index);
  }, []);

  const onBack = useCallback(() => {
    if (step === 0) return;
    goTo(step - 1);
  }, [goTo, step]);

  const onNext = useCallback(() => {
    if (!last) {
      goTo(step + 1);
      return;
    }
    if (hideNext) void dispatch(dismissOnboarding());
    else dispatch(hideOnboarding());
  }, [dispatch, goTo, hideNext, last, step]);

  return (
    <Modal visible={open} animationType="fade" presentationStyle="fullScreen" onRequestClose={onBack}>
      {open ? <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} /> : null}
      <View style={[styles.root, { paddingTop: Math.max(insets.top, 12), paddingBottom: Math.max(insets.bottom, 12) }]}>
        <Text style={styles.kicker}>{t('onboard.kicker')}</Text>
        <PagerView
          ref={pager}
          style={styles.pager}
          initialPage={0}
          onPageSelected={(event) => setStep(event.nativeEvent.position)}>
          {STEPS.map((item) => (
            <View key={item.title} collapsable={false} style={styles.page}>
              <ScrollView
                style={styles.slide}
                contentContainerStyle={styles.slideBody}
                showsVerticalScrollIndicator={false}
                bounces={false}>
                <Text style={styles.title}>{t(item.title)}</Text>
                <Text style={styles.body}>{t(item.body)}</Text>
                <View style={styles.stage}>
                  <StepVisual visual={item.visual} />
                </View>
              </ScrollView>
            </View>
          ))}
        </PagerView>

        <View style={styles.footer}>
          <View style={styles.dots}>
            {STEPS.map((item, index) => (
              <Pressable key={item.title} onPress={() => goTo(index)} hitSlop={8}>
                <View style={[styles.dot, index === step && styles.dotOn]} />
              </Pressable>
            ))}
          </View>
          {last ? (
            <Pressable onPress={() => setHideNext((value) => !value)} style={styles.check} hitSlop={6}>
              <MaterialDesignIcons
                name={hideNext ? 'checkbox-marked' : 'checkbox-blank-outline'}
                size={20}
                color={hideNext ? colors.accent : colors.faint}
              />
              <Text style={styles.checkLabel}>{t('onboard.done')}</Text>
            </Pressable>
          ) : null}
          <Pressable onPress={onNext} style={({ pressed }) => [styles.cta, pressed && styles.pressed]}>
            <Text style={styles.ctaText}>{t(last ? 'onboard.gotIt' : 'onboard.next')}</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
});

function onboardStyles(colors: ThemeColors) {
  return {
    root: { flex: 1, backgroundColor: colors.bg, paddingHorizontal: 20 },
    kicker: {
      color: colors.accent,
      fontFamily: fonts.semibold,
      fontSize: 12,
      letterSpacing: 1.4,
      textTransform: 'uppercase' as const,
      marginBottom: 4,
    },
    pager: { flex: 1 },
    page: { flex: 1 },
    slide: { flex: 1 },
    slideBody: { flexGrow: 1, paddingBottom: 8 },
    title: { color: colors.text, fontSize: 26, fontFamily: fonts.bold, marginTop: 8, lineHeight: 32 },
    body: { color: colors.muted, fontFamily: fonts.medium, fontSize: 14, lineHeight: 21, marginTop: 8 },
    stage: {
      flexGrow: 1,
      marginTop: 16,
      minHeight: 420,
      backgroundColor: colors.bg,
      borderWidth: 1,
      borderColor: colors.cardBorder,
      borderRadius: radius.xl,
      overflow: 'hidden' as const,
    },
    phone: { flex: 1 },
    feed: { flex: 1, overflow: 'hidden' as const, paddingTop: 20 },
    mockHeader: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'space-between' as const,
      paddingHorizontal: 20,
      paddingTop: 4,
      gap: 8,
      marginBottom: 10,
    },
    titles: { flex: 1, minWidth: 0 },
    mockTitle: { color: colors.text, fontSize: 18, fontFamily: fonts.bold },
    subtitle: { color: colors.muted, fontFamily: fonts.medium, fontSize: 12, marginTop: 2 },
    mockActions: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 8 },
    searchRow: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: 8,
      paddingHorizontal: 20,
      marginBottom: 10,
    },
    search: { flex: 1 },
    banner: {
      marginHorizontal: 20,
      marginBottom: 12,
      backgroundColor: colors.accentDim,
      borderWidth: 1,
      borderColor: colors.accentDim,
      borderRadius: radius.lg,
      padding: 16,
      gap: 4,
    },
    bannerTitle: { color: colors.accent, fontFamily: fonts.semibold, fontSize: 16 },
    bannerMeta: { color: colors.muted, fontFamily: fonts.medium, fontSize: 13, lineHeight: 18 },
    list: { paddingHorizontal: 20, paddingBottom: 16 },
    serviceList: { paddingHorizontal: 20, paddingBottom: 16, gap: 16 },
    tabList: { flex: 1, paddingHorizontal: 20, paddingTop: 4, paddingBottom: 12, gap: 10, justifyContent: 'space-between' as const },
    note: {
      backgroundColor: colors.card,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.cardBorder,
      paddingHorizontal: 14,
      paddingVertical: 12,
    },
    noteText: { color: colors.muted, fontFamily: fonts.medium, fontSize: 13, lineHeight: 18 },
    tabLine: {
      flexDirection: 'row' as const,
      alignItems: 'flex-start' as const,
      gap: 10,
      paddingVertical: 4,
    },
    tabLineText: { flex: 1, paddingTop: 4 },
    tabName: { color: colors.text, fontFamily: fonts.semibold, fontSize: 14 },
    tabHint: { color: colors.muted, fontFamily: fonts.medium, fontSize: 13, lineHeight: 18 },
    iconWrap: {
      width: 44,
      height: 32,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
    },
    iconPill: {
      position: 'absolute' as const,
      width: 40,
      height: 28,
      borderRadius: 8,
      backgroundColor: colors.accentDim,
    },
    segment: { flexDirection: 'row' as const, gap: 8, paddingHorizontal: 20, marginBottom: 12 },
    seg: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: radius.full,
      backgroundColor: colors.chip,
      borderWidth: 1,
      borderColor: colors.chipBorder,
    },
    segOn: { backgroundColor: colors.accent, borderColor: colors.accent },
    segText: { color: colors.text, fontSize: 12, fontFamily: fonts.medium },
    segOnText: { color: colors.accentText, fontSize: 12, fontFamily: fonts.medium },
    profilePad: { paddingHorizontal: 20, gap: 8, paddingBottom: 8 },
    profileHead: { alignItems: 'center' as const, paddingVertical: 20, paddingHorizontal: 16 },
    profileName: { color: colors.text, fontFamily: fonts.bold, fontSize: 20, marginTop: 10, textAlign: 'center' as const },
    profileRole: { color: colors.accent, fontFamily: fonts.semibold, fontSize: 13, marginTop: 4, textAlign: 'center' as const },
    profileMeta: {
      color: colors.faint,
      fontFamily: fonts.medium,
      fontSize: 13,
      marginTop: 8,
      lineHeight: 18,
      textAlign: 'center' as const,
    },
    sectionLabel: {
      color: colors.muted,
      fontFamily: fonts.semibold,
      fontSize: 12,
      letterSpacing: 0.4,
      textTransform: 'uppercase' as const,
      marginTop: 8,
    },
    rowBetween: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'space-between' as const,
      marginTop: 4,
    },
    link: { color: colors.accent, fontFamily: fonts.semibold, fontSize: 14 },
    miniCopy: { flex: 1, minWidth: 0, gap: 2 },
    miniTitle: { color: colors.text, fontFamily: fonts.semibold, fontSize: 14, lineHeight: 18 },
    miniMeta: { color: colors.muted, fontFamily: fonts.medium, fontSize: 12, lineHeight: 16 },
    kanbanBox: {
      backgroundColor: colors.bgMid,
      borderWidth: 1,
      borderColor: colors.cardBorder,
      borderRadius: radius.lg,
      padding: 10,
      gap: 8,
    },
    sectionHead: { flexDirection: 'row' as const, alignItems: 'center' as const, justifyContent: 'space-between' as const },
    sectionTitle: { color: colors.muted, fontFamily: fonts.semibold, fontSize: 11, textTransform: 'uppercase' as const },
    sectionCount: { color: colors.faint, fontFamily: fonts.medium, fontSize: 12 },
    pipelineCard: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: 8,
      paddingVertical: 10,
      paddingRight: 12,
    },
    tabBar: {
      flexDirection: 'row' as const,
      borderTopWidth: 1,
      borderTopColor: colors.cardBorder,
      paddingHorizontal: 4,
      paddingTop: 8,
      paddingBottom: 10,
      backgroundColor: colors.card,
    },
    tabBarItem: { flex: 1, minWidth: 0, alignItems: 'center' as const, gap: 2 },
    tabBarLabel: {
      fontSize: 10,
      lineHeight: 12,
      fontFamily: fonts.semibold,
      textAlign: 'center' as const,
      width: '100%' as const,
      includeFontPadding: false,
      paddingHorizontal: 1,
    },
    footer: { gap: 14, paddingTop: 18 },
    dots: { flexDirection: 'row' as const, justifyContent: 'center' as const, alignItems: 'center' as const, gap: 6 },
    dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.chipBorder },
    dotOn: { width: 18, backgroundColor: colors.accent },
    cta: {
      backgroundColor: colors.accent,
      borderRadius: radius.full,
      paddingVertical: 16,
      alignItems: 'center' as const,
    },
    ctaText: { color: colors.accentText, fontFamily: fonts.bold, fontSize: 16 },
    check: {
      alignSelf: 'flex-end' as const,
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: 6,
      paddingVertical: 4,
    },
    checkLabel: { color: colors.muted, fontFamily: fonts.medium, fontSize: 12, lineHeight: 16 },
    pressed: { opacity: 0.86 },
  };
}

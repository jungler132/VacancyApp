import { useCallback, useMemo } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';

import { AppHeader } from '@/components/AppHeader';
import { SelectChip } from '@/components/FilterChips';
import { NavRow } from '@/components/NavRow';
import { ServiceAvatar } from '@/components/ServiceAvatar';
import { Text } from '@/components/AppText';
import { APP_LOCALES, keyOf, type AppLocale } from '@/lib/i18n';
import { useT } from '@/lib/i18n/useT';
import { jobHref } from '@/lib/jobRoute';
import { useTabBarLayout } from '@/lib/layout';
import { SAVED_HREF, SERVICE_ME_HREF, SETTINGS_HREF, STATS_HREF } from '@/lib/services/catalog';
import { jobTier } from '@/lib/tiers';
import { setLocale } from '@/lib/store/appearanceSlice';
import { pinViewedJob } from '@/lib/store/jobsSlice';
import { openPaywall, clearPremiumStub } from '@/lib/store/premiumSlice';
import { recordVisit } from '@/lib/store/visitsSlice';
import { useAppDispatch, useAppSelector } from '@/lib/store/hooks';
import { selectOwnMaster } from '@/lib/store/selectors';
import { colors, fonts, radius } from '@/lib/theme';

export default function ProfileScreen() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const t = useT();
  const tabBar = useTabBarLayout();
  const locale = useAppSelector((state) => state.appearance.locale);
  const own = useAppSelector(selectOwnMaster);
  const isPremium = useAppSelector((state) => state.premium.isPremium);
  const savedJobs = useAppSelector((state) => state.saved.items.length);
  const savedResources = useAppSelector((state) => state.savedCatalog.items.length);
  const localJobs = useAppSelector((state) => state.localJobs.items);
  const visits = useAppSelector((state) => state.visits.items);
  const name = own?.displayName.trim() || t('common.guest');
  const frequent = useMemo(() => visits.slice(0, 5), [visits]);

  const onLocale = useCallback((id: string | number) => dispatch(setLocale(id as AppLocale)), [dispatch]);
  const openVisit = useCallback(
    (item: (typeof frequent)[number]) => {
      dispatch(recordVisit({ id: item.id, title: item.title, url: item.url, kind: item.kind }));
      if (item.kind === 'telegram') {
        Linking.openURL(item.url).catch(() => undefined);
        return;
      }
      WebBrowser.openBrowserAsync(item.url).catch(() => undefined);
    },
    [dispatch],
  );

  return (
    <View style={styles.screen}>
      <AppHeader title={t('profile.title')} />
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: tabBar.listPaddingBottom }]}>
        <View style={styles.head}>
          <ServiceAvatar uri={own?.avatarUri} name={name} size={64} />
          <View style={styles.headBody}>
            <Text style={styles.name}>{name}</Text>
            <Text style={styles.meta}>{own?.bio?.trim() || t('profile.guestMeta')}</Text>
          </View>
        </View>

        <Text style={styles.section}>{t('profile.language')}</Text>
        <View style={styles.wrap}>
          {APP_LOCALES.map((id) => (
            <SelectChip key={id} id={id} label={t(keyOf('lang', id))} selected={locale === id} onChange={onLocale} />
          ))}
        </View>

        <NavRow
          title={t('nav.saved')}
          meta={t('saved.subtitle', { jobs: savedJobs, resources: savedResources })}
          onPress={() => router.push(SAVED_HREF)}
        />
        <NavRow title={t('profile.servicePage')} meta={t('profile.serviceMeta')} onPress={() => router.push(SERVICE_ME_HREF)} />
        <NavRow title={t('nav.stats')} meta={t('profile.statsMeta')} onPress={() => router.push(STATS_HREF)} />
        <NavRow title={t('nav.settings')} meta={t('profile.settingsMeta')} onPress={() => router.push(SETTINGS_HREF)} />

        <View style={styles.rowBetween}>
          <Text style={styles.section}>{t('profile.jobs')}</Text>
          <Pressable onPress={() => router.push('/job/create')} hitSlop={8}>
            <Text style={styles.link}>{t('profile.create')}</Text>
          </Pressable>
        </View>
        {localJobs.length ? (
          localJobs.map((job) => (
            <NavRow
              key={job.id}
              title={job.title}
              meta={`${job.company}${jobTier(job) === 1 ? ` · ${t('profile.jobPremium')}` : ' · Workly'}`}
              onPress={() => {
                dispatch(pinViewedJob(job));
                router.push(jobHref(job.id));
              }}
            />
          ))
        ) : (
          <Text style={styles.empty}>{t('profile.jobsEmpty')}</Text>
        )}

        <Text style={styles.section}>{t('profile.visits')}</Text>
        {frequent.length ? (
          frequent.map((item) => (
            <NavRow
              key={item.id}
              title={item.title}
              meta={t('profile.opens', { count: item.count })}
              onPress={() => openVisit(item)}
            />
          ))
        ) : (
          <Text style={styles.empty}>{t('profile.visitsEmpty')}</Text>
        )}

        <Text style={styles.section}>{t('common.premium')}</Text>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{isPremium ? t('profile.accountPremium') : t('profile.accountFree')}</Text>
          <Text style={styles.cardNote}>{isPremium ? t('profile.premiumOn') : t('profile.premiumHint')}</Text>
          {isPremium ? (
            <Pressable
              onPress={() => dispatch(clearPremiumStub())}
              style={({ pressed }) => [styles.reset, pressed && styles.pressed]}>
              <Text style={styles.resetText}>{t('profile.resetPremium')}</Text>
            </Pressable>
          ) : (
            <Pressable
              onPress={() => dispatch(openPaywall())}
              style={({ pressed }) => [styles.buy, pressed && styles.pressed]}>
              <Text style={styles.buyText}>{t('profile.buy')}</Text>
            </Pressable>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: 'transparent' },
  content: { padding: 16, gap: 8 },
  head: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 8 },
  headBody: { flex: 1, minWidth: 0 },
  name: { color: colors.text, fontFamily: fonts.bold, fontSize: 22 },
  meta: { color: colors.faint, fontFamily: fonts.medium, fontSize: 13, marginTop: 4, lineHeight: 18 },
  section: {
    color: colors.muted,
    fontFamily: fonts.semibold,
    fontSize: 12,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    marginTop: 12,
    marginBottom: 4,
  },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 },
  link: { color: colors.accent, fontFamily: fonts.semibold, fontSize: 14 },
  empty: { color: colors.faint, fontFamily: fonts.medium, fontSize: 13, marginBottom: 4 },
  card: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: radius.lg,
    padding: 14,
    gap: 8,
  },
  cardTitle: { color: colors.text, fontFamily: fonts.bold, fontSize: 16 },
  cardNote: { color: colors.muted, fontFamily: fonts.medium, fontSize: 13, lineHeight: 18 },
  buy: {
    marginTop: 4,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buyText: { color: colors.accentText, fontFamily: fonts.bold, fontSize: 15 },
  reset: {
    marginTop: 4,
    height: 44,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.chipBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resetText: { color: colors.muted, fontFamily: fonts.semibold, fontSize: 15 },
  pressed: { opacity: 0.86 },
});

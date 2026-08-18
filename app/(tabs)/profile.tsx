import { memo, useCallback, useMemo } from 'react';
import { Linking, Pressable, ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';

import { AppHeader } from '@/components/AppHeader';
import { NavRow } from '@/components/NavRow';
import { ServiceAvatar } from '@/components/ServiceAvatar';
import { Text } from '@/components/AppText';
import { useT } from '@/lib/i18n/useT';
import { jobHref } from '@/lib/jobRoute';
import { useTabBarLayout } from '@/lib/layout';
import { offerEditorHref, SAVED_HREF, SERVICE_ME_HREF, STATS_HREF } from '@/lib/services/catalog';
import { jobTier } from '@/lib/tiers';
import { pinViewedJob } from '@/lib/store/jobsSlice';
import { openPaywall, clearPremiumStub } from '@/lib/store/premiumSlice';
import { clearVisits, recordVisit, removeVisit } from '@/lib/store/visitsSlice';
import { useAppDispatch, useAppSelector } from '@/lib/store/hooks';
import { selectOwnMaster } from '@/lib/store/selectors';
import { fonts, radius, shadowsFor, useThemedStyles, type ColorSchemeName, type ThemeColors } from '@/lib/theme';

export default function ProfileScreen() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const t = useT();
  const styles = useThemedStyles(profileStyles);
  const tabBar = useTabBarLayout();
  const own = useAppSelector(selectOwnMaster);
  const isPremium = useAppSelector((state) => state.premium.isPremium);
  const savedJobs = useAppSelector((state) => state.saved.items.length);
  const savedResources = useAppSelector((state) => state.savedCatalog.items.length);
  const localJobs = useAppSelector((state) => state.localJobs.items);
  const visits = useAppSelector((state) => state.visits.items);
  const hasPage = Boolean(own?.displayName.trim());
  const name = own?.displayName.trim() || t('common.guest');
  const frequent = useMemo(() => visits.slice(0, 8), [visits]);
  const role = hasPage ? t('profile.master') : t('common.guest');
  const pageMeta = hasPage
    ? t('profile.pageMeta', { count: own?.offers.length ?? 0 })
    : t('profile.pageEmpty');

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

  const openPage = useCallback(() => router.push(SERVICE_ME_HREF), [router]);
  const openNewOffer = useCallback(() => {
    router.push(hasPage ? offerEditorHref('new') : SERVICE_ME_HREF);
  }, [hasPage, router]);

  return (
    <View style={styles.screen}>
      <AppHeader title={t('tab.profile')} />
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: tabBar.listPaddingBottom }]}>
        <Pressable onPress={openPage} style={({ pressed }) => [styles.head, pressed && styles.pressed]}>
          <ServiceAvatar uri={own?.avatarUri} name={name} size={80} />
          <Text style={styles.name}>{name}</Text>
          <Text style={styles.role}>
            {role}
            {isPremium ? ` · ${t('common.premium')}` : ''}
          </Text>
          <Text style={styles.meta}>{own?.bio?.trim() || t('profile.guestMeta')}</Text>
          <Text style={styles.edit}>{hasPage ? t('profile.servicePage') : t('profile.pageEmpty')}</Text>
        </Pressable>

        <View style={styles.grid}>
          <Shortcut
            title={t('nav.saved')}
            meta={t('saved.subtitle', { jobs: savedJobs, resources: savedResources })}
            onPress={() => router.push(SAVED_HREF)}
          />
          <Shortcut title={t('nav.stats')} meta={t('profile.statsMeta')} onPress={() => router.push(STATS_HREF)} />
          <Shortcut title={t('profile.servicePage')} meta={pageMeta} onPress={openPage} />
          <Shortcut
            title={t('common.premium')}
            meta={isPremium ? t('profile.accountPremium') : t('profile.accountFree')}
            onPress={() => dispatch(isPremium ? clearPremiumStub() : openPaywall())}
          />
        </View>

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
              meta={`${offer.featured ? `${t('common.premium')} · ` : ''}${offer.price ? `${offer.price} ${offer.currency}` : t('services.priceNegotiable')}`}
              onPress={() => router.push(offerEditorHref(offer.id))}
            />
          ))
        ) : (
          <Text style={styles.empty}>{t('me.emptyOffers')}</Text>
        )}

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
              meta={`${job.company}${jobTier(job) === 1 ? ` · ${t('profile.jobPremium')}` : ` · ${t('common.workly')}`}`}
              onPress={() => {
                dispatch(pinViewedJob(job));
                router.push(jobHref(job.id));
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

const Shortcut = memo(function Shortcut({
  title,
  meta,
  onPress,
}: {
  title: string;
  meta: string;
  onPress: () => void;
}) {
  const styles = useThemedStyles(profileStyles);
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.tile, pressed && styles.pressed]}>
      <Text style={styles.tileTitle}>{title}</Text>
      <Text style={styles.tileMeta} numberOfLines={2}>
        {meta}
      </Text>
    </Pressable>
  );
});

function profileStyles(colors: ThemeColors, scheme: ColorSchemeName) {
  return {
    screen: { flex: 1, backgroundColor: 'transparent' },
    content: { padding: 16, gap: 8 },
    head: {
      alignItems: 'center' as const,
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.cardBorder,
      borderRadius: radius.lg,
      paddingVertical: 24,
      paddingHorizontal: 16,
      marginBottom: 8,
      ...shadowsFor(scheme).card,
    },
    name: { color: colors.text, fontFamily: fonts.bold, fontSize: 22, marginTop: 12, textAlign: 'center' as const },
    role: { color: colors.accent, fontFamily: fonts.semibold, fontSize: 13, marginTop: 4 },
    meta: {
      color: colors.faint,
      fontFamily: fonts.medium,
      fontSize: 13,
      marginTop: 8,
      lineHeight: 18,
      textAlign: 'center' as const,
    },
    edit: { color: colors.accent, fontFamily: fonts.semibold, fontSize: 13, marginTop: 12 },
    grid: { flexDirection: 'row' as const, flexWrap: 'wrap' as const, gap: 8 },
    tile: {
      width: '48%' as const,
      flexGrow: 1,
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.cardBorder,
      borderRadius: radius.lg,
      padding: 14,
      minHeight: 88,
      ...shadowsFor(scheme).card,
    },
    tileTitle: { color: colors.text, fontFamily: fonts.semibold, fontSize: 15 },
    tileMeta: { color: colors.faint, fontFamily: fonts.medium, fontSize: 12, marginTop: 6, lineHeight: 16 },
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
  };
}

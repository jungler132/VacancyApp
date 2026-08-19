import { memo, useCallback, useMemo, useState } from 'react';
import { FlatList, Pressable, View } from 'react-native';

import { CatalogLinkCard } from '@/components/CatalogLinkCard';
import { Text } from '@/components/AppText';
import { EmptyState } from '@/components/EmptyState';
import { ChipWrap } from '@/components/ChipWrap';
import { SelectChip } from '@/components/FilterChips';
import { JobCard } from '@/components/JobCard';
import { SaveStar } from '@/components/SaveStar';
import { ServiceMasterCard } from '@/components/ServiceMasterCard';
import { ServiceOfferCard } from '@/components/ServiceOfferCard';
import { APPLY_STATUSES, type ApplyStatus } from '@/lib/apply';
import { keyOf } from '@/lib/i18n';
import { useT } from '@/lib/i18n/useT';
import { useLockedNav } from '@/lib/hooks/useLockedNav';
import { masterHref, offerViewHref } from '@/lib/services/catalog';
import { catalogSaveKey, type SavedCatalogItem } from '@/lib/store/savedCatalogSlice';
import { serviceSaveKey, toggleSavedService, type SavedServiceItem } from '@/lib/store/savedServicesSlice';
import { useAppDispatch, useAppSelector } from '@/lib/store/hooks';
import { selectMasterById, selectOfferView, selectSavedCatalogItems } from '@/lib/store/selectors';
import { fonts, radius, shadowsFor, useThemedStyles, type ColorSchemeName, type ThemeColors } from '@/lib/theme';

type SavedPage = 'jobs' | 'services' | 'resources';
type ResourceRow =
  | { type: 'header'; id: string; title: string }
  | { type: 'card'; id: string; item: SavedCatalogItem };

const SavedServiceRow = memo(function SavedServiceRow({ item }: { item: SavedServiceItem }) {
  const nav = useLockedNav();
  const dispatch = useAppDispatch();
  const styles = useThemedStyles(savedStyles);
  const liveOffer = useAppSelector((state) => (item.kind === 'offer' ? selectOfferView(state, item.id) : undefined));
  const liveMaster = useAppSelector((state) =>
    selectMasterById(state, item.kind === 'master' ? item.id : item.profileId),
  );
  const openMaster = useCallback((id: string) => nav.push(masterHref(id)), [nav]);
  const openOffer = useCallback((id: string) => nav.push(offerViewHref(id)), [nav]);
  const onToggle = useCallback(() => {
    dispatch(toggleSavedService(item));
  }, [dispatch, item]);

  if (item.kind === 'master' && liveMaster) {
    return <ServiceMasterCard master={liveMaster} onPress={openMaster} />;
  }
  if (item.kind === 'offer' && liveOffer) {
    return <ServiceOfferCard offer={liveOffer.offer} profile={liveOffer.master} onPress={openOffer} />;
  }

  return (
    <Pressable
      onPress={() => (item.kind === 'master' ? openMaster(item.id) : openOffer(item.id))}
      style={({ pressed }) => [styles.fallback, pressed && styles.pressed]}>
      <View style={styles.fallbackBody}>
        <Text style={styles.fallbackTitle}>{item.title}</Text>
        {item.kind === 'offer' && item.masterName ? (
          <Text style={styles.fallbackMeta}>{item.masterName}</Text>
        ) : null}
      </View>
      <SaveStar saved onToggle={onToggle} />
    </Pressable>
  );
});

export default function SavedScreen() {
  const t = useT();
  const styles = useThemedStyles(savedStyles);
  const saved = useAppSelector((state) => state.saved.items);
  const statuses = useAppSelector((state) => state.saved.statuses);
  const catalog = useAppSelector(selectSavedCatalogItems);
  const services = useAppSelector((state) => state.savedServices.items);
  const [page, setPage] = useState<SavedPage>('jobs');
  const [status, setStatus] = useState<ApplyStatus | 'all'>('all');
  const jobIds = useMemo(() => {
    const all = saved.map((item) => item.id);
    if (status === 'all') return all;
    return all.filter((id) => statuses[id] === status);
  }, [saved, status, statuses]);
  const resourceRows = useMemo(() => {
    const channels = catalog.filter((item) => item.kind === 'telegram');
    const sites = catalog.filter((item) => item.kind === 'site');
    const rows: ResourceRow[] = [];
    const showHeaders = channels.length > 0 && sites.length > 0;
    if (channels.length) {
      if (showHeaders) rows.push({ type: 'header', id: 'h-telegram', title: t('saved.telegram') });
      for (const item of channels) rows.push({ type: 'card', id: catalogSaveKey(item.kind, item.id), item });
    }
    if (sites.length) {
      if (showHeaders) rows.push({ type: 'header', id: 'h-sites', title: t('saved.sites') });
      for (const item of sites) rows.push({ type: 'card', id: catalogSaveKey(item.kind, item.id), item });
    }
    return rows;
  }, [catalog, t]);

  const renderJob = useCallback(({ item }: { item: string }) => <JobCard jobId={item} />, []);
  const renderService = useCallback(({ item }: { item: SavedServiceItem }) => <SavedServiceRow item={item} />, []);
  const renderResource = useCallback(({ item }: { item: ResourceRow }) => {
    if (item.type === 'header') return <Text style={styles.groupTitle}>{item.title}</Text>;
    return <CatalogLinkCard item={item.item} telegram={item.item.kind === 'telegram'} />;
  }, [styles.groupTitle]);
  const keyExtractor = useCallback((item: string) => item, []);
  const serviceKey = useCallback((item: SavedServiceItem) => serviceSaveKey(item), []);
  const resourceKey = useCallback((item: ResourceRow) => item.id, []);
  const onStatusAll = useCallback(() => setStatus('all'), []);
  const onStatus = useCallback((id: string | number) => setStatus(id as ApplyStatus), []);

  return (
    <View style={styles.screen}>
      <View style={styles.tabs}>
        {(['jobs', 'services', 'resources'] as const).map((id) => (
          <Pressable
            key={id}
            onPress={() => setPage(id)}
            style={[styles.tab, page === id && styles.tabOn]}
            android_ripple={null}>
            <Text style={[styles.tabLabel, page === id && styles.tabLabelOn]}>
              {id === 'jobs' ? t('saved.jobs') : id === 'services' ? t('saved.services') : t('saved.resources')}
            </Text>
          </Pressable>
        ))}
      </View>
      {page === 'jobs' && saved.length ? (
        <View style={styles.filters}>
          <ChipWrap>
            <SelectChip id="all" label={t('common.all')} compact selected={status === 'all'} onChange={onStatusAll} />
            {APPLY_STATUSES.map((item) => (
              <SelectChip
                key={item.id}
                id={item.id}
                label={t(keyOf('apply', item.id))}
                compact
                selected={status === item.id}
                onChange={onStatus}
              />
            ))}
          </ChipWrap>
        </View>
      ) : null}
      {page === 'jobs' ? (
        <FlatList
          data={jobIds}
          keyExtractor={keyExtractor}
          renderItem={renderJob}
          contentContainerStyle={styles.list}
          initialNumToRender={8}
          maxToRenderPerBatch={8}
          windowSize={7}
          ListEmptyComponent={
            <EmptyState
              title={t('common.empty')}
              subtitle={status === 'all' ? t('saved.emptyJobs') : t('saved.emptyStatus')}
            />
          }
        />
      ) : page === 'services' ? (
        <FlatList
          data={services}
          keyExtractor={serviceKey}
          renderItem={renderService}
          contentContainerStyle={styles.list}
          initialNumToRender={8}
          maxToRenderPerBatch={8}
          windowSize={5}
          ItemSeparatorComponent={() => <View style={styles.sep} />}
          ListEmptyComponent={<EmptyState title={t('common.empty')} subtitle={t('saved.emptyServices')} />}
        />
      ) : (
        <FlatList
          data={resourceRows}
          keyExtractor={resourceKey}
          renderItem={renderResource}
          contentContainerStyle={styles.list}
          initialNumToRender={8}
          maxToRenderPerBatch={8}
          windowSize={5}
          ListEmptyComponent={<EmptyState title={t('common.empty')} subtitle={t('saved.emptyResources')} />}
        />
      )}
    </View>
  );
}

function savedStyles(colors: ThemeColors, scheme: ColorSchemeName) {
  return {
    screen: { flex: 1, backgroundColor: 'transparent' },
    tabs: { flexDirection: 'row' as const, gap: 8, paddingHorizontal: 20, paddingTop: 12 },
    tab: {
      flex: 1,
      alignItems: 'center' as const,
      paddingHorizontal: 8,
      paddingVertical: 8,
      borderRadius: radius.full,
      backgroundColor: colors.chip,
      borderWidth: 1,
      borderColor: colors.chipBorder,
    },
    tabOn: { backgroundColor: colors.accent, borderColor: colors.accent },
    tabLabel: { color: colors.text, fontSize: 12, fontFamily: fonts.medium, letterSpacing: 0.4 },
    tabLabelOn: { color: colors.accentText },
    filters: { paddingHorizontal: 20, paddingTop: 12 },
    list: { padding: 20, paddingBottom: 40 },
    sep: { height: 10 },
    groupTitle: { color: colors.faint, fontSize: 13, fontFamily: fonts.semibold, marginTop: 6, marginBottom: 2 },
    fallback: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: 12,
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.cardBorder,
      borderRadius: radius.lg,
      padding: 16,
      ...shadowsFor(scheme).card,
    },
    fallbackBody: { flex: 1, minWidth: 0, gap: 4 },
    fallbackTitle: { color: colors.text, fontFamily: fonts.semibold, fontSize: 16 },
    fallbackMeta: { color: colors.faint, fontFamily: fonts.medium, fontSize: 13 },
    pressed: { opacity: 0.86 },
  };
}

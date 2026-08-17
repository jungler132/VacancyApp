import { useCallback, useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';

import { CatalogLinkCard } from '@/components/CatalogLinkCard';
import { Text } from '@/components/AppText';
import { EmptyState } from '@/components/EmptyState';
import { SelectChip } from '@/components/FilterChips';
import { JobCard } from '@/components/JobCard';
import { APPLY_STATUSES, type ApplyStatus } from '@/lib/apply';
import { keyOf } from '@/lib/i18n';
import { useT } from '@/lib/i18n/useT';
import { catalogSaveKey, type SavedCatalogItem } from '@/lib/store/savedCatalogSlice';
import { useAppSelector } from '@/lib/store/hooks';
import { selectSavedCatalogItems } from '@/lib/store/selectors';
import { colors, fonts } from '@/lib/theme';

type SavedPage = 'jobs' | 'resources';
type ResourceRow =
  | { type: 'header'; id: string; title: string }
  | { type: 'card'; id: string; item: SavedCatalogItem };

export default function SavedScreen() {
  const t = useT();
  const saved = useAppSelector((state) => state.saved.items);
  const statuses = useAppSelector((state) => state.saved.statuses);
  const catalog = useAppSelector(selectSavedCatalogItems);
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
  const renderResource = useCallback(({ item }: { item: ResourceRow }) => {
    if (item.type === 'header') return <Text style={styles.groupTitle}>{item.title}</Text>;
    return <CatalogLinkCard item={item.item} telegram={item.item.kind === 'telegram'} />;
  }, []);
  const keyExtractor = useCallback((item: string) => item, []);
  const resourceKey = useCallback((item: ResourceRow) => item.id, []);
  const onStatusAll = useCallback(() => setStatus('all'), []);
  const onStatus = useCallback((id: string | number) => setStatus(id as ApplyStatus), []);

  return (
    <View style={styles.screen}>
      <View style={styles.tabs}>
        {(['jobs', 'resources'] as const).map((id) => (
          <Pressable key={id} onPress={() => setPage(id)} style={styles.tab} android_ripple={null}>
            <Text style={[styles.tabLabel, page === id && styles.tabLabelOn]}>
              {id === 'jobs' ? t('saved.jobs') : t('saved.resources')}
            </Text>
            <View style={[styles.tabLine, page === id && styles.tabLineOn]} />
          </Pressable>
        ))}
      </View>
      {page === 'jobs' && saved.length ? (
        <View style={styles.filters}>
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

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: 'transparent' },
  tabs: { flexDirection: 'row', paddingHorizontal: 12, paddingTop: 8 },
  tab: { flex: 1, alignItems: 'center', gap: 8 },
  tabLabel: { color: colors.faint, fontSize: 14, fontFamily: fonts.semibold },
  tabLabelOn: { color: colors.text },
  tabLine: { height: 2, alignSelf: 'stretch', borderRadius: 1, backgroundColor: 'transparent' },
  tabLineOn: { backgroundColor: colors.accent },
  filters: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingHorizontal: 16, paddingTop: 10 },
  list: { padding: 16, paddingBottom: 40 },
  groupTitle: { color: colors.faint, fontSize: 13, fontFamily: fonts.semibold, marginTop: 6, marginBottom: 2 },
});

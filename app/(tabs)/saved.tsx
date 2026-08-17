import { useCallback, useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';

import { AppHeader } from '@/components/AppHeader';
import { CatalogLinkCard } from '@/components/CatalogLinkCard';
import { Text } from '@/components/AppText';
import { EmptyState } from '@/components/EmptyState';
import { SelectChip } from '@/components/FilterChips';
import { JobCard } from '@/components/JobCard';
import { APPLY_STATUSES, type ApplyStatus } from '@/lib/apply';
import { useTabBarLayout } from '@/lib/layout';
import { catalogSaveKey, type SavedCatalogItem } from '@/lib/store/savedCatalogSlice';
import { useAppSelector } from '@/lib/store/hooks';
import { selectSavedCatalogItems } from '@/lib/store/selectors';
import { colors, fonts } from '@/lib/theme';

const TABS = [
  { id: 'jobs', label: 'Вакансии' },
  { id: 'resources', label: 'Ресурсы' },
] as const;

type SavedPage = (typeof TABS)[number]['id'];

type ResourceRow =
  | { type: 'header'; id: string; title: string }
  | { type: 'card'; id: string; item: SavedCatalogItem };

function toResourceRows(items: SavedCatalogItem[]): ResourceRow[] {
  const channels = items.filter((item) => item.kind === 'telegram');
  const sites = items.filter((item) => item.kind === 'site');
  const rows: ResourceRow[] = [];
  const showHeaders = channels.length > 0 && sites.length > 0;
  if (channels.length) {
    if (showHeaders) rows.push({ type: 'header', id: 'h-telegram', title: 'Telegram' });
    for (const item of channels) {
      rows.push({ type: 'card', id: catalogSaveKey(item.kind, item.id), item });
    }
  }
  if (sites.length) {
    if (showHeaders) rows.push({ type: 'header', id: 'h-sites', title: 'Сайты' });
    for (const item of sites) {
      rows.push({ type: 'card', id: catalogSaveKey(item.kind, item.id), item });
    }
  }
  return rows;
}

export default function SavedScreen() {
  const saved = useAppSelector((state) => state.saved.items);
  const statuses = useAppSelector((state) => state.saved.statuses);
  const catalog = useAppSelector(selectSavedCatalogItems);
  const tabBar = useTabBarLayout();
  const [page, setPage] = useState<SavedPage>('jobs');
  const [status, setStatus] = useState<ApplyStatus | 'all'>('all');
  const jobIds = useMemo(() => {
    const all = saved.map((item) => item.id);
    if (status === 'all') return all;
    return all.filter((id) => statuses[id] === status);
  }, [saved, status, statuses]);
  const resourceRows = useMemo(() => toResourceRows(catalog), [catalog]);

  const renderJob = useCallback(({ item }: { item: string }) => <JobCard jobId={item} />, []);
  const renderResource = useCallback(({ item }: { item: ResourceRow }) => {
    if (item.type === 'header') return <Text style={styles.groupTitle}>{item.title}</Text>;
    return <CatalogLinkCard item={item.item} telegram={item.item.kind === 'telegram'} />;
  }, []);
  const keyExtractor = useCallback((item: string) => item, []);
  const resourceKey = useCallback((item: ResourceRow) => item.id, []);

  const jobsEmpty =
    status === 'all' ? 'Нажмите звезду на вакансии — она появится здесь.' : 'Нет вакансий с таким статусом.';

  return (
    <View style={styles.screen}>
      <AppHeader
        title="Избранное"
        subtitle={`${saved.length} вакансий · ${catalog.length} ресурсов`}>
        <View style={styles.tabs}>
          {TABS.map((item) => (
            <Pressable key={item.id} onPress={() => setPage(item.id)} style={styles.tab} android_ripple={null}>
              <Text style={[styles.tabLabel, page === item.id && styles.tabLabelOn]}>{item.label}</Text>
              <View style={[styles.tabLine, page === item.id && styles.tabLineOn]} />
            </Pressable>
          ))}
        </View>
      </AppHeader>
      {page === 'jobs' && saved.length ? (
        <View style={styles.filters}>
          <SelectChip id="all" label="Все" compact selected={status === 'all'} onChange={() => setStatus('all')} />
          {APPLY_STATUSES.map((item) => (
            <SelectChip
              key={item.id}
              id={item.id}
              label={item.label}
              compact
              selected={status === item.id}
              onChange={() => setStatus(item.id)}
            />
          ))}
        </View>
      ) : null}
      {page === 'jobs' ? (
        <FlatList
          data={jobIds}
          keyExtractor={keyExtractor}
          renderItem={renderJob}
          contentContainerStyle={[styles.list, { paddingBottom: tabBar.listPaddingBottom }]}
          initialNumToRender={8}
          maxToRenderPerBatch={8}
          windowSize={7}
          updateCellsBatchingPeriod={50}
          removeClippedSubviews
          ListEmptyComponent={<EmptyState title="Пока пусто" subtitle={jobsEmpty} />}
        />
      ) : (
        <FlatList
          data={resourceRows}
          keyExtractor={resourceKey}
          renderItem={renderResource}
          contentContainerStyle={[styles.list, { paddingBottom: tabBar.listPaddingBottom }]}
          initialNumToRender={8}
          maxToRenderPerBatch={8}
          windowSize={5}
          updateCellsBatchingPeriod={50}
          removeClippedSubviews
          ListEmptyComponent={
            <EmptyState
              title="Пока пусто"
              subtitle="Нажмите звезду на канале или сайте в разделе Ресурсы."
            />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: 'transparent' },
  tabs: { flexDirection: 'row', marginTop: 10, marginHorizontal: -12, marginBottom: -8 },
  tab: { flex: 1, alignItems: 'center', gap: 8 },
  tabLabel: { color: colors.faint, fontSize: 14, fontFamily: fonts.semibold },
  tabLabelOn: { color: colors.text },
  tabLine: { height: 2, alignSelf: 'stretch', borderRadius: 1, backgroundColor: 'transparent' },
  tabLineOn: { backgroundColor: colors.accent },
  filters: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingHorizontal: 16, paddingTop: 10 },
  list: { padding: 16 },
  groupTitle: { color: colors.faint, fontSize: 13, fontFamily: fonts.semibold, marginTop: 6, marginBottom: 2 },
});

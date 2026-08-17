import { useCallback, useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';

import { AppHeader, FiltersButton } from '@/components/AppHeader';
import { CatalogFiltersSheet } from '@/components/CatalogFiltersSheet';
import { CatalogLinkCard } from '@/components/CatalogLinkCard';
import { Text } from '@/components/AppText';
import { EmptyState } from '@/components/EmptyState';
import { useTabBarLayout } from '@/lib/layout';
import {
  DEFAULT_CATALOG_FILTERS,
  JOB_SITES,
  TELEGRAM_GROUPS,
  catalogFiltersActive,
  filterCatalogBySelection,
  groupCatalogByCountry,
  type CatalogFilters,
  type CatalogLink,
} from '@/lib/telegramGroups';
import { colors, fonts } from '@/lib/theme';

const SECTIONS = [
  { id: 'telegram', label: 'Telegram', items: TELEGRAM_GROUPS, telegram: true },
  { id: 'sites', label: 'Сайты', items: JOB_SITES, telegram: false },
] as const;

type CatalogRow =
  | { type: 'header'; id: string; title: string }
  | { type: 'card'; id: string; item: CatalogLink; telegram: boolean };

function toRows(items: CatalogLink[], telegram: boolean): CatalogRow[] {
  const groups = groupCatalogByCountry(items);
  const rows: CatalogRow[] = [];
  const showHeaders = groups.length > 1;
  for (const group of groups) {
    if (showHeaders) rows.push({ type: 'header', id: `h-${group.id}`, title: group.label });
    for (const item of group.items) rows.push({ type: 'card', id: item.id, item, telegram });
  }
  return rows;
}

export default function ResourcesScreen() {
  const tabBar = useTabBarLayout();
  const [page, setPage] = useState(0);
  const [filters, setFilters] = useState<CatalogFilters>(DEFAULT_CATALOG_FILTERS);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [sheetReady, setSheetReady] = useState(false);
  const section = SECTIONS[page];
  const visible = useMemo(
    () => filterCatalogBySelection(section.items, filters),
    [section.items, filters],
  );
  const rows = useMemo(() => toRows(visible, section.telegram), [visible, section.telegram]);
  const filtersActive = catalogFiltersActive(filters);

  const openSheet = useCallback(() => {
    setSheetReady(true);
    setSheetOpen(true);
  }, []);

  const closeSheet = useCallback(() => setSheetOpen(false), []);
  const resetFilters = useCallback(() => setFilters(DEFAULT_CATALOG_FILTERS), []);

  const renderItem = useCallback(({ item }: { item: CatalogRow }) => {
    if (item.type === 'header') return <Text style={styles.groupTitle}>{item.title}</Text>;
    return <CatalogLinkCard item={item.item} telegram={item.telegram} />;
  }, []);

  const keyExtractor = useCallback((item: CatalogRow) => item.id, []);

  return (
    <View style={styles.screen}>
      <AppHeader
        title="Ресурсы"
        subtitle={`${visible.length} из ${section.items.length}`}
        right={<FiltersButton active={filtersActive} onPress={openSheet} />}>
        <View style={styles.tabs}>
          {SECTIONS.map((item, index) => (
            <Pressable key={item.id} onPress={() => setPage(index)} style={styles.tab} android_ripple={null}>
              <Text style={[styles.tabLabel, page === index && styles.tabLabelOn]}>{item.label}</Text>
              <View style={[styles.tabLine, page === index && styles.tabLineOn]} />
            </Pressable>
          ))}
        </View>
      </AppHeader>
      <FlatList
        key={section.id}
        data={rows}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        initialNumToRender={8}
        maxToRenderPerBatch={8}
        windowSize={5}
        updateCellsBatchingPeriod={50}
        removeClippedSubviews
        contentContainerStyle={[styles.content, { paddingBottom: tabBar.listPaddingBottom }]}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <EmptyState
            title="Нет ресурсов в этой стране"
            subtitle="Выберите другую страну или сбросьте фильтр."
            actionLabel="Сбросить фильтры"
            onAction={resetFilters}
          />
        }
      />
      {sheetReady ? (
        <CatalogFiltersSheet
          open={sheetOpen}
          filters={filters}
          resultCount={visible.length}
          onChange={setFilters}
          onClose={closeSheet}
          onReset={resetFilters}
        />
      ) : null}
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
  content: { padding: 16 },
  groupTitle: { color: colors.faint, fontSize: 13, fontFamily: fonts.semibold, marginTop: 6, marginBottom: 2 },
});

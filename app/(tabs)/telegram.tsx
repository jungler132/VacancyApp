import { useCallback, useMemo, useState } from 'react';
import { FlatList, Pressable, View } from 'react-native';

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
import { fonts, radius, useThemedStyles, type ColorSchemeName, type ThemeColors } from '@/lib/theme';
import { keyOf } from '@/lib/i18n';
import { useT } from '@/lib/i18n/useT';

const SECTIONS = [
  { id: 'telegram', items: TELEGRAM_GROUPS, telegram: true },
  { id: 'sites', items: JOB_SITES, telegram: false },
] as const;

type CatalogRow =
  | { type: 'header'; id: string; title: string }
  | { type: 'card'; id: string; item: CatalogLink; telegram: boolean };

function toRows(items: CatalogLink[], telegram: boolean, countryName: (id: string) => string): CatalogRow[] {
  const groups = groupCatalogByCountry(items);
  const rows: CatalogRow[] = [];
  const showHeaders = groups.length > 1;
  for (const group of groups) {
    if (showHeaders) rows.push({ type: 'header', id: `h-${group.id}`, title: countryName(group.id) });
    for (const item of group.items) rows.push({ type: 'card', id: item.id, item, telegram });
  }
  return rows;
}

export default function ResourcesScreen() {
  const t = useT();
  const styles = useThemedStyles(telegramStyles);
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
  const rows = useMemo(
    () => toRows(visible, section.telegram, (id) => t(keyOf('country', id))),
    [visible, section.telegram, t],
  );
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
  }, [styles.groupTitle]);

  const keyExtractor = useCallback((item: CatalogRow) => item.id, []);

  return (
    <View style={styles.screen}>
      <AppHeader
        title={t('tab.resources')}
        subtitle={t('resources.subtitle', { visible: visible.length, total: section.items.length })}
        right={<FiltersButton active={filtersActive} onPress={openSheet} />}>
        <View style={styles.tabs}>
          {SECTIONS.map((item, index) => (
            <Pressable
              key={item.id}
              onPress={() => setPage(index)}
              style={[styles.tab, page === index && styles.tabOn]}
              android_ripple={null}>
              <Text style={[styles.tabLabel, page === index && styles.tabLabelOn]}>
                {item.id === 'telegram' ? t('saved.telegram') : t('saved.sites')}
              </Text>
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
            title={t('resources.emptyTitle')}
            subtitle={t('resources.emptyHint')}
            actionLabel={t('common.resetFilters')}
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

function telegramStyles(colors: ThemeColors, _scheme: ColorSchemeName) {
  return {
    screen: { flex: 1, backgroundColor: 'transparent' },
    tabs: { flexDirection: 'row' as const, gap: 8, marginTop: 12 },
    tab: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: radius.full,
      backgroundColor: colors.chip,
      borderWidth: 1,
      borderColor: colors.chipBorder,
    },
    tabOn: { backgroundColor: colors.accent, borderColor: colors.accent },
    tabLabel: { color: colors.text, fontSize: 12, fontFamily: fonts.medium, letterSpacing: 0.4 },
    tabLabelOn: { color: colors.accentText },
    content: { padding: 20 },
    groupTitle: { color: colors.faint, fontSize: 13, fontFamily: fonts.semibold, marginTop: 6, marginBottom: 2 },
  };
}

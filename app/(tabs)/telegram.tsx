import { memo, useCallback, useMemo, useRef, useState } from 'react';
import { FlatList, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import * as WebBrowser from 'expo-web-browser';
import MaterialDesignIcons from '@react-native-vector-icons/material-design-icons';

import { AppHeader, FiltersButton } from '@/components/AppHeader';
import { CatalogFiltersSheet } from '@/components/CatalogFiltersSheet';
import { EmptyState } from '@/components/EmptyState';
import { useTabBarLayout } from '@/lib/layout';
import {
  DEFAULT_CATALOG_FILTERS,
  JOB_SITES,
  TELEGRAM_GROUPS,
  catalogFiltersActive,
  countryMeta,
  filterCatalogBySelection,
  groupCatalogByCountry,
  type CatalogFilters,
  type CatalogLink,
} from '@/lib/telegramGroups';
import { colors, fonts, radius, regionColor } from '@/lib/theme';

const SECTIONS = [
  { id: 'telegram', label: 'Telegram', items: TELEGRAM_GROUPS, telegram: true },
  { id: 'sites', label: 'Сайты', items: JOB_SITES, telegram: false },
] as const;

type CatalogRow =
  | { type: 'header'; id: string; title: string }
  | { type: 'card'; id: string; item: CatalogLink; telegram: boolean };

async function openCatalogLink(item: CatalogLink) {
  if (item.handle) {
    await Linking.openURL(item.url);
    return;
  }
  await WebBrowser.openBrowserAsync(item.url);
}

const LinkCard = memo(function LinkCard({ item, telegram }: { item: CatalogLink; telegram: boolean }) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const country = countryMeta(item.country);
  const tint = regionColor[country.region] ?? colors.muted;

  const onOpen = useCallback(() => {
    openCatalogLink(item).catch(() => undefined);
  }, [item]);

  const onCopy = useCallback(async () => {
    await Clipboard.setStringAsync(item.url);
    setCopied(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopied(false), 1600);
  }, [item.url]);

  return (
    <View style={styles.card}>
      <View style={styles.cardHead}>
        <Text style={styles.cardTitle}>{item.title}</Text>
        <View style={[styles.countryBadge, { borderColor: tint }]}>
          <Text style={[styles.countryLabel, { color: tint }]}>{country.label}</Text>
        </View>
      </View>
      {telegram && item.handle ? <Text style={styles.handle}>@{item.handle}</Text> : null}
      {item.note ? <Text style={styles.note}>{item.note}</Text> : null}
      <View style={styles.actions}>
        <Pressable onPress={onOpen} style={({ pressed }) => [styles.openBtn, pressed && styles.pressed]}>
          <MaterialDesignIcons name={telegram ? 'send' : 'open-in-new'} size={16} color={colors.accentText} />
          <Text style={styles.openLabel}>Открыть</Text>
        </Pressable>
        <Pressable onPress={onCopy} style={({ pressed }) => [styles.copyBtn, pressed && styles.pressed]}>
          <MaterialDesignIcons name={copied ? 'check' : 'content-copy'} size={16} color={copied ? colors.accent : colors.muted} />
          <Text style={[styles.copyLabel, copied && styles.copyDone]}>{copied ? 'Скопировано' : 'Ссылка'}</Text>
        </Pressable>
      </View>
    </View>
  );
});

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
    return <LinkCard item={item.item} telegram={item.telegram} />;
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
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: 14,
    marginBottom: 10,
  },
  cardHead: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  cardTitle: { color: colors.text, fontSize: 16, fontFamily: fonts.semibold, flex: 1 },
  countryBadge: {
    borderWidth: 1,
    borderRadius: radius.sm,
    paddingHorizontal: 7,
    paddingVertical: 3,
    maxWidth: 140,
  },
  countryLabel: { fontSize: 11, fontFamily: fonts.semibold },
  handle: { color: colors.faint, fontSize: 13, fontFamily: fonts.medium, marginTop: 4 },
  note: { color: colors.muted, fontSize: 13, marginTop: 6, lineHeight: 18 },
  actions: { flexDirection: 'row', gap: 8, marginTop: 12 },
  openBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.accent,
  },
  openLabel: { color: colors.accentText, fontSize: 14, fontFamily: fonts.semibold },
  copyBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 40,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.chipBorder,
    backgroundColor: colors.chip,
  },
  copyLabel: { color: colors.muted, fontSize: 14, fontFamily: fonts.semibold },
  copyDone: { color: colors.accent },
  pressed: { opacity: 0.82 },
});

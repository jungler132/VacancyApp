import { memo, useCallback, useMemo, useState } from 'react';
import { FlatList, Pressable, View } from 'react-native';
import { useLockedNav } from '@/lib/hooks/useLockedNav';

import { AppHeader, FilterIconButton } from '@/components/AppHeader';
import { Text } from '@/components/AppText';
import { EmptyState } from '@/components/EmptyState';
import { SearchField } from '@/components/SearchField';
import { ServiceMasterCard } from '@/components/ServiceMasterCard';
import { ServicesFiltersSheet } from '@/components/ServicesFiltersSheet';
import { filterServiceMasters, masterHref, SERVICE_ME_HREF } from '@/lib/services/catalog';
import type { ServiceKindId, ServiceMaster } from '@/lib/services/types';
import { useTabBarLayout } from '@/lib/layout';
import { useAppSelector } from '@/lib/store/hooks';
import { selectCatalogMasters, selectOwnMaster } from '@/lib/store/selectors';
import { fonts, radius, useThemedStyles, type ColorSchemeName, type ThemeColors } from '@/lib/theme';
import { useT } from '@/lib/i18n/useT';

const Separator = memo(function Separator() {
  const styles = useThemedStyles(servicesStyles);
  return <View style={styles.sep} />;
});

const CreatePageBanner = memo(function CreatePageBanner({
  title,
  meta,
  onPress,
}: {
  title: string;
  meta: string;
  onPress: () => void;
}) {
  const styles = useThemedStyles(servicesStyles);
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.create, pressed && styles.pressed]}>
      <Text style={styles.createTitle}>{title}</Text>
      <Text style={styles.createMeta}>{meta}</Text>
    </Pressable>
  );
});

export default function ServicesScreen() {
  const t = useT();
  const nav = useLockedNav();
  const styles = useThemedStyles(servicesStyles);
  const tabBar = useTabBarLayout();
  const own = useAppSelector(selectOwnMaster);
  const masters = useAppSelector(selectCatalogMasters);
  const [query, setQuery] = useState('');
  const [kind, setKind] = useState<ServiceKindId | 'all'>('all');
  const [sheetOpen, setSheetOpen] = useState(false);
  const [sheetReady, setSheetReady] = useState(false);
  const visible = useMemo(() => filterServiceMasters(masters, query, kind), [masters, query, kind]);
  const filtersActive = kind !== 'all';
  const listPadding = useMemo(
    () => [styles.content, { paddingBottom: tabBar.listPaddingBottom }],
    [styles.content, tabBar.listPaddingBottom],
  );

  const openSheet = useCallback(() => {
    setSheetReady(true);
    setSheetOpen(true);
  }, []);
  const closeSheet = useCallback(() => setSheetOpen(false), []);
  const resetFilters = useCallback(() => setKind('all'), []);
  const openMaster = useCallback((id: string) => nav.push(masterHref(id)), [nav]);
  const openEditor = useCallback(() => nav.push(SERVICE_ME_HREF), [nav]);
  const renderItem = useCallback(
    ({ item }: { item: ServiceMaster }) => <ServiceMasterCard master={item} onPress={openMaster} />,
    [openMaster],
  );
  const keyExtractor = useCallback((item: ServiceMaster) => item.id, []);

  return (
    <View style={styles.screen}>
      <AppHeader title={t('tab.services')} subtitle={t('services.subtitle', { count: visible.length })}>
        <View style={styles.searchRow}>
          <View style={styles.search}>
            <SearchField value={query} onSearch={setQuery} placeholder={t('search.services')} />
          </View>
          <FilterIconButton active={filtersActive} onPress={openSheet} />
        </View>
      </AppHeader>
      <FlatList
        data={visible}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        contentContainerStyle={listPadding}
        ItemSeparatorComponent={Separator}
        ListHeaderComponent={
          own?.displayName.trim() ? null : (
            <CreatePageBanner
              title={t('services.createTitle')}
              meta={t('services.createMeta')}
              onPress={openEditor}
            />
          )
        }
        ListEmptyComponent={
          <EmptyState
            title={t('services.emptyTitle')}
            subtitle={t('services.emptyHint')}
            actionLabel={filtersActive ? t('common.resetFilters') : undefined}
            onAction={filtersActive ? resetFilters : undefined}
          />
        }
        initialNumToRender={8}
        maxToRenderPerBatch={8}
        windowSize={5}
        removeClippedSubviews
        showsVerticalScrollIndicator={false}
      />
      {sheetReady ? (
        <ServicesFiltersSheet
          open={sheetOpen}
          kind={kind}
          resultCount={visible.length}
          onChangeKind={setKind}
          onClose={closeSheet}
          onReset={resetFilters}
        />
      ) : null}
    </View>
  );
}

function servicesStyles(colors: ThemeColors, _scheme: ColorSchemeName) {
  return {
    screen: { flex: 1, backgroundColor: 'transparent' },
    searchRow: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 8, marginTop: 12 },
    search: { flex: 1 },
    content: { padding: 20 },
    sep: { height: 12 },
    create: {
      backgroundColor: colors.accentDim,
      borderWidth: 1,
      borderColor: colors.accentDim,
      borderRadius: radius.lg,
      padding: 16,
      marginBottom: 12,
      gap: 4,
    },
    createTitle: { color: colors.accent, fontFamily: fonts.semibold, fontSize: 16 },
    createMeta: { color: colors.muted, fontFamily: fonts.medium, fontSize: 13, lineHeight: 18 },
    pressed: { opacity: 0.86 },
  };
}

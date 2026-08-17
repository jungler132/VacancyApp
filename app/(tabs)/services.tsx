import { memo, useCallback, useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';

import { AppHeader, FiltersButton } from '@/components/AppHeader';
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
import { colors, fonts } from '@/lib/theme';

const Separator = memo(function Separator() {
  return <View style={styles.sep} />;
});

const CreatePageBanner = memo(function CreatePageBanner({ onPress }: { onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.create, pressed && styles.pressed]}>
      <Text style={styles.createTitle}>Создать свою страницу</Text>
      <Text style={styles.createMeta}>Профиль, виды услуг и цены — на этом устройстве, потом уйдёт в сеть.</Text>
    </Pressable>
  );
});

export default function ServicesScreen() {
  const router = useRouter();
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
    [tabBar.listPaddingBottom],
  );

  const openSheet = useCallback(() => {
    setSheetReady(true);
    setSheetOpen(true);
  }, []);
  const closeSheet = useCallback(() => setSheetOpen(false), []);
  const resetFilters = useCallback(() => setKind('all'), []);
  const openMaster = useCallback((id: string) => router.push(masterHref(id)), [router]);
  const openEditor = useCallback(() => router.push(SERVICE_ME_HREF), [router]);
  const renderItem = useCallback(
    ({ item }: { item: ServiceMaster }) => <ServiceMasterCard master={item} onPress={openMaster} />,
    [openMaster],
  );
  const keyExtractor = useCallback((item: ServiceMaster) => item.id, []);

  return (
    <View style={styles.screen}>
      <AppHeader
        title="Услуги"
        subtitle={`${visible.length} мастеров`}
        right={<FiltersButton active={filtersActive} onPress={openSheet} />}>
        <SearchField value={query} onSearch={setQuery} placeholder="Имя или услуга" />
      </AppHeader>
      <FlatList
        data={visible}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        contentContainerStyle={listPadding}
        ItemSeparatorComponent={Separator}
        ListHeaderComponent={own?.displayName.trim() ? null : <CreatePageBanner onPress={openEditor} />}
        ListEmptyComponent={
          <EmptyState
            title="Никого не нашли"
            subtitle="Смените вид услуги или сбросьте поиск."
            actionLabel={filtersActive ? 'Сбросить фильтры' : undefined}
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

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: 'transparent' },
  content: { padding: 16 },
  sep: { height: 8 },
  create: {
    backgroundColor: colors.accentDim,
    borderWidth: 1,
    borderColor: colors.accent,
    borderRadius: 8,
    padding: 14,
    marginBottom: 12,
    gap: 4,
  },
  createTitle: { color: colors.accent, fontFamily: fonts.semibold, fontSize: 16 },
  createMeta: { color: colors.muted, fontFamily: fonts.medium, fontSize: 13, lineHeight: 18 },
  pressed: { opacity: 0.86 },
});

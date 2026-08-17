import { memo, useCallback } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { IconButton } from 'react-native-paper';

import { AppHeader, FiltersButton } from '@/components/AppHeader';
import { SelectChip } from '@/components/FilterChips';
import { SearchField } from '@/components/SearchField';
import { TIER_FILTERS, type TierFilter } from '@/lib/tiers';
import { setTierFilter } from '@/lib/store/filtersSlice';
import { useAppDispatch, useAppSelector } from '@/lib/store/hooks';
import { colors } from '@/lib/theme';

export const JobsHeader = memo(function JobsHeader({
  query,
  filtersActive,
  refreshing,
  onSearch,
  onOpenFilters,
  onRefresh,
}: {
  query?: string;
  filtersActive: boolean;
  refreshing?: boolean;
  onSearch: (value: string) => void;
  onOpenFilters: () => void;
  onRefresh: () => void;
}) {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const tierFilter = useAppSelector((state) => state.filters.tierFilter);

  const onTier = useCallback(
    (id: string | number) => {
      dispatch(setTierFilter(id as TierFilter));
    },
    [dispatch],
  );

  return (
    <AppHeader
      title="Вакансии"
      right={
        <View style={styles.actions}>
          <IconButton
            icon="plus"
            size={20}
            onPress={() => router.push('/job/create')}
            iconColor={colors.text}
            accessibilityLabel="Создать вакансию"
            style={styles.icon}
          />
          <IconButton
            icon="refresh"
            size={20}
            onPress={onRefresh}
            disabled={refreshing}
            iconColor={colors.muted}
            accessibilityLabel="Обновить вакансии"
            style={styles.icon}
          />
          <FiltersButton active={filtersActive} onPress={onOpenFilters} />
        </View>
      }>
      <View style={styles.search}>
        <SearchField value={query} onSearch={onSearch} />
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tiers}
        style={styles.tierRow}>
        {TIER_FILTERS.map((item) => (
          <SelectChip
            key={String(item.id)}
            id={item.id}
            label={item.label}
            compact
            selected={tierFilter === item.id}
            onChange={onTier}
          />
        ))}
      </ScrollView>
    </AppHeader>
  );
});

const styles = StyleSheet.create({
  actions: { flexDirection: 'row', alignItems: 'center' },
  icon: { margin: 0, width: 36, height: 36 },
  search: { marginTop: 8 },
  tierRow: { marginTop: 8, marginHorizontal: -4 },
  tiers: { flexDirection: 'row', gap: 8, paddingHorizontal: 4, paddingBottom: 2 },
});

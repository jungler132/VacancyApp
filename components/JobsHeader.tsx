import { memo, useCallback } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { IconButton } from 'react-native-paper';

import { AppHeader, FilterIconButton } from '@/components/AppHeader';
import { SelectChip } from '@/components/FilterChips';
import { SearchField } from '@/components/SearchField';
import { TIER_FILTERS, type TierFilter } from '@/lib/tiers';
import { setTierFilter } from '@/lib/store/filtersSlice';
import { useAppDispatch, useAppSelector } from '@/lib/store/hooks';
import { useColors } from '@/lib/theme';
import { keyOf } from '@/lib/i18n';
import { useT } from '@/lib/i18n/useT';

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
  const t = useT();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const colors = useColors();
  const tierFilter = useAppSelector((state) => state.filters.tierFilter);

  const onTier = useCallback(
    (id: string | number) => {
      dispatch(setTierFilter(id as TierFilter));
    },
    [dispatch],
  );

  return (
    <AppHeader
      title={t('tab.jobs')}
      right={
        <View style={styles.actions}>
          <IconButton
            icon="plus"
            size={20}
            onPress={() => router.push('/job/create')}
            iconColor={colors.accent}
            accessibilityLabel={t('jobs.createA11y')}
            style={styles.icon}
          />
          <IconButton
            icon="refresh"
            size={20}
            onPress={onRefresh}
            disabled={refreshing}
            iconColor={colors.muted}
            accessibilityLabel={t('jobs.refreshA11y')}
            style={styles.icon}
          />
        </View>
      }>
      <View style={styles.searchRow}>
        <View style={styles.search}>
          <SearchField value={query} onSearch={onSearch} placeholder={t('search.jobs')} />
        </View>
        <FilterIconButton active={filtersActive} onPress={onOpenFilters} />
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
            label={item.id === 'all' ? t('common.all') : t(keyOf('common', item.id === 1 ? 'premium' : item.id === 2 ? 'workly' : 'platforms'))}
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
  searchRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12 },
  search: { flex: 1 },
  tierRow: { marginTop: 12, marginHorizontal: -4 },
  tiers: { gap: 8, paddingHorizontal: 4, paddingBottom: 2 },
});

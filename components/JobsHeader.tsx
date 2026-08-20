import { memo, useCallback } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useLockedNav } from '@/lib/hooks/useLockedNav';
import { IconButton } from 'react-native-paper';

import { AppHeader, FilterIconButton } from '@/components/AppHeader';
import { CreateJobButton } from '@/components/CreateJobButton';
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
  const nav = useLockedNav();
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
          <CreateJobButton onPress={() => nav.push('/job/create')} />
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
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tierRow}>
        <View style={styles.tiers} collapsable={false}>
          {TIER_FILTERS.map((item) => (
            <SelectChip
              key={String(item.id)}
              id={item.id}
              label={
                item.id === 'all'
                  ? t('common.all')
                  : t(keyOf('common', item.id === 1 ? 'premium' : item.id === 2 ? 'app' : 'platforms'))
              }
              compact
              selected={tierFilter === item.id}
              onChange={onTier}
            />
          ))}
        </View>
      </ScrollView>
    </AppHeader>
  );
});

const styles = StyleSheet.create({
  actions: { flexDirection: 'row', alignItems: 'center' },
  icon: { margin: 0, width: 36, height: 36 },
  searchRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12 },
  search: { flex: 1 },
  tierRow: { marginTop: 12, marginHorizontal: -4, flexGrow: 0 },
  tiers: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
});

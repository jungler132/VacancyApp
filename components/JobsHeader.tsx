import { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { FilterChips } from '@/components/FilterChips';
import { SearchField } from '@/components/SearchField';
import { AGE_PRESETS, type AgeFilter } from '@/lib/filters';
import { colors, fonts, radius } from '@/lib/theme';

export const JobsHeader = memo(function JobsHeader({
  maxAgeDays,
  fromCache,
  filtersActive,
  onSearch,
  onChangeAge,
  onOpenFilters,
  onResetCache,
}: {
  maxAgeDays: AgeFilter;
  fromCache: boolean;
  filtersActive: boolean;
  onSearch: (value: string) => void;
  onChangeAge: (value: AgeFilter) => void;
  onOpenFilters: () => void;
  onResetCache: () => void;
}) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.header, { paddingTop: insets.top + 4 }]}>
      <View style={styles.searchRow}>
        <View style={styles.search}>
          <SearchField onSearch={onSearch} />
        </View>
        <Pressable onPress={onOpenFilters} style={[styles.filterBtn, filtersActive && styles.filterBtnOn]}>
          <Text style={[styles.filterBtnText, filtersActive && styles.filterBtnTextOn]}>Фильтры</Text>
        </Pressable>
      </View>
      <View style={styles.metaRow}>
        <View style={styles.ages}>
          <FilterChips items={AGE_PRESETS} value={maxAgeDays} onChange={onChangeAge} compact />
        </View>
        <Pressable onPress={onResetCache} hitSlop={8} style={styles.cacheChip}>
          <Text style={styles.cacheChipText}>{fromCache ? 'Кэш' : '↻'}</Text>
        </Pressable>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 12,
    paddingBottom: 8,
    gap: 6,
    backgroundColor: colors.glass,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.cardBorder,
  },
  searchRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  search: { flex: 1 },
  filterBtn: {
    borderWidth: 1,
    borderColor: colors.chipBorder,
    backgroundColor: colors.chip,
    borderRadius: radius.md,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  filterBtnOn: { borderColor: colors.accent, backgroundColor: colors.accentDim },
  filterBtnText: { color: colors.muted, fontFamily: fonts.semibold, fontSize: 12 },
  filterBtnTextOn: { color: colors.accent },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  ages: { flex: 1 },
  cacheChip: {
    borderWidth: 1,
    borderColor: colors.chipBorder,
    backgroundColor: colors.chip,
    borderRadius: 16,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  cacheChipText: { color: colors.muted, fontSize: 11, fontFamily: fonts.semibold },
});

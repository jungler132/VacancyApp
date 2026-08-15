import { memo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { SearchField } from '@/components/SearchField';
import { colors } from '@/lib/theme';

export const JobsHeader = memo(function JobsHeader({
  filtersActive,
  onSearch,
  onOpenFilters,
}: {
  filtersActive: boolean;
  onSearch: (value: string) => void;
  onOpenFilters: () => void;
}) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.header, { paddingTop: insets.top + 4 }]}>
      <View style={styles.searchRow}>
        <View style={styles.search}>
          <SearchField onSearch={onSearch} />
        </View>
        <Button
          mode={filtersActive ? 'contained-tonal' : 'outlined'}
          compact
          onPress={onOpenFilters}
          icon="filter-variant"
          style={styles.filterBtn}
          labelStyle={styles.filterLabel}>
          Фильтры
        </Button>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 12,
    paddingBottom: 8,
    backgroundColor: colors.glass,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.cardBorder,
  },
  searchRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  search: { flex: 1 },
  filterBtn: { borderColor: colors.chipBorder, borderRadius: 6 },
  filterLabel: { marginVertical: 6, fontSize: 12 },
});

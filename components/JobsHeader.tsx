import { memo } from 'react';
import { StyleSheet, View } from 'react-native';
import { IconButton } from 'react-native-paper';

import { AppHeader, FiltersButton } from '@/components/AppHeader';
import { SearchField } from '@/components/SearchField';
import { colors } from '@/lib/theme';

export const JobsHeader = memo(function JobsHeader({
  filtersActive,
  refreshing,
  onSearch,
  onOpenFilters,
  onRefresh,
}: {
  filtersActive: boolean;
  refreshing?: boolean;
  onSearch: (value: string) => void;
  onOpenFilters: () => void;
  onRefresh: () => void;
}) {
  return (
    <AppHeader
      title="Вакансии"
      right={
        <View style={styles.actions}>
          <IconButton
            icon="refresh"
            size={20}
            onPress={onRefresh}
            disabled={refreshing}
            iconColor={colors.muted}
            accessibilityLabel="Обновить вакансии"
            style={styles.refresh}
          />
          <FiltersButton active={filtersActive} onPress={onOpenFilters} />
        </View>
      }>
      <View style={styles.search}>
        <SearchField onSearch={onSearch} />
      </View>
    </AppHeader>
  );
});

const styles = StyleSheet.create({
  actions: { flexDirection: 'row', alignItems: 'center' },
  refresh: { margin: 0, width: 36, height: 36 },
  search: { marginTop: 8 },
});

import { useCallback, useMemo, useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';

import { AppHeader } from '@/components/AppHeader';
import { EmptyState } from '@/components/EmptyState';
import { SelectChip } from '@/components/FilterChips';
import { JobCard } from '@/components/JobCard';
import { APPLY_STATUSES, type ApplyStatus } from '@/lib/apply';
import { useTabBarLayout } from '@/lib/layout';
import { useAppSelector } from '@/lib/store/hooks';

export default function SavedScreen() {
  const saved = useAppSelector((state) => state.saved.items);
  const statuses = useAppSelector((state) => state.saved.statuses);
  const tabBar = useTabBarLayout();
  const [status, setStatus] = useState<ApplyStatus | 'all'>('all');
  const ids = useMemo(() => {
    const all = saved.map((item) => item.id);
    if (status === 'all') return all;
    return all.filter((id) => statuses[id] === status);
  }, [saved, status, statuses]);
  const renderItem = useCallback(({ item }: { item: string }) => <JobCard jobId={item} />, []);
  const keyExtractor = useCallback((item: string) => item, []);

  return (
    <View style={styles.screen}>
      <AppHeader title="Избранное" />
      {saved.length ? (
        <View style={styles.filters}>
          <SelectChip id="all" label="Все" compact selected={status === 'all'} onChange={() => setStatus('all')} />
          {APPLY_STATUSES.map((item) => (
            <SelectChip
              key={item.id}
              id={item.id}
              label={item.label}
              compact
              selected={status === item.id}
              onChange={() => setStatus(item.id)}
            />
          ))}
        </View>
      ) : null}
      <FlatList
        data={ids}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        contentContainerStyle={[styles.list, { paddingBottom: tabBar.listPaddingBottom }]}
        initialNumToRender={8}
        maxToRenderPerBatch={8}
        windowSize={7}
        updateCellsBatchingPeriod={50}
        removeClippedSubviews
        ListEmptyComponent={
          <EmptyState
            title="Пока пусто"
            subtitle={
              status === 'all'
                ? 'Нажмите звезду на вакансии — она появится здесь.'
                : 'Нет вакансий с таким статусом.'
            }
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: 'transparent' },
  filters: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingHorizontal: 16, paddingTop: 10 },
  list: { padding: 16 },
});

import { useCallback, useMemo } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';

import { AppHeader } from '@/components/AppHeader';
import { EmptyState } from '@/components/EmptyState';
import { JobCard } from '@/components/JobCard';
import { ScreenBackdrop } from '@/components/ScreenBackdrop';
import { useTabBarLayout } from '@/lib/layout';
import { useAppSelector } from '@/lib/store/hooks';
import { colors } from '@/lib/theme';

export default function SavedScreen() {
  const saved = useAppSelector((state) => state.saved.items);
  const tabBar = useTabBarLayout();
  const ids = useMemo(() => saved.map((item) => item.id), [saved]);
  const renderItem = useCallback(({ item }: { item: string }) => <JobCard jobId={item} />, []);
  const keyExtractor = useCallback((item: string) => item, []);

  return (
    <View style={styles.screen}>
      <ScreenBackdrop />
      <AppHeader title="Избранное" />
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
          <EmptyState title="Пока пусто" subtitle="Нажмите звезду на вакансии — она появится здесь." />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  list: { padding: 16 },
});

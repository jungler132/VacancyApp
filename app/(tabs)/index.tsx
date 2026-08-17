import { useCallback, useRef, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import { ActivityIndicator } from 'react-native-paper';

import { EmptyState } from '@/components/EmptyState';
import { JobCard } from '@/components/JobCard';
import { JobSkeletonList } from '@/components/JobSkeleton';
import { JobsHeader } from '@/components/JobsHeader';
import { useJobsFeed } from '@/lib/hooks/useJobsFeed';
import { useTabBarLayout } from '@/lib/layout';
import { colors } from '@/lib/theme';

export default function JobsScreen() {
  const headerHRef = useRef(88);
  const [headerH, setHeaderH] = useState(88);
  const endGuard = useRef(false);
  const visibleCount = useRef(0);
  const feed = useJobsFeed();
  const tabBar = useTabBarLayout();

  if (feed.visibleIds.length > visibleCount.current) endGuard.current = false;
  visibleCount.current = feed.visibleIds.length;

  const renderItem = useCallback(({ item }: { item: string }) => <JobCard jobId={item} />, []);
  const keyExtractor = useCallback((item: string) => item, []);
  const onHeaderLayout = useCallback((height: number) => {
    if (Math.abs(height - headerHRef.current) < 2) return;
    headerHRef.current = height;
    setHeaderH(height);
  }, []);

  const onEndReached = useCallback(() => {
    if (endGuard.current || feed.loadingMore || !feed.visibleIds.length) return;
    endGuard.current = true;
    feed.loadMore();
  }, [feed]);

  const onScrollBeginDrag = useCallback(() => {
    endGuard.current = false;
  }, []);

  const emptyError = feed.status === 'error';

  return (
    <View style={styles.screen}>
      <FlatList
        data={feed.visibleIds}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        contentContainerStyle={[
          styles.list,
          { paddingTop: headerH + 8, paddingBottom: tabBar.listPaddingBottom },
        ]}
        keyboardShouldPersistTaps="always"
        keyboardDismissMode="none"
        initialNumToRender={8}
        maxToRenderPerBatch={8}
        windowSize={7}
        updateCellsBatchingPeriod={50}
        removeClippedSubviews={false}
        onEndReachedThreshold={0.15}
        onEndReached={onEndReached}
        onScrollBeginDrag={onScrollBeginDrag}
        refreshControl={
          <RefreshControl
            refreshing={feed.refreshing}
            tintColor={colors.accent}
            onRefresh={feed.refresh}
            progressViewOffset={headerH}
          />
        }
        ListEmptyComponent={
          feed.loading ? (
            <JobSkeletonList />
          ) : (
            <EmptyState
              title={emptyError ? 'Не удалось загрузить' : 'Ничего не нашлось'}
              subtitle={
                emptyError ? 'Проверьте сеть и обновите ленту.' : 'Смените регион, давность или источники.'
              }
              actionLabel={emptyError || !feed.filtersActive ? 'Обновить' : 'Сбросить фильтры'}
              onAction={emptyError || !feed.filtersActive ? feed.refresh : feed.resetFilters}
            />
          )
        }
        ListFooterComponent={
          <View style={styles.footer}>{feed.loadingMore ? <ActivityIndicator /> : null}</View>
        }
      />

      <View style={styles.headerWrap} onLayout={(event) => onHeaderLayout(event.nativeEvent.layout.height)}>
        <JobsHeader
          query={feed.query}
          filtersActive={feed.filtersActive}
          refreshing={feed.refreshing}
          onSearch={feed.setQuery}
          onOpenFilters={feed.openSheet}
          onRefresh={feed.refresh}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: 'transparent' },
  list: { paddingHorizontal: 16 },
  headerWrap: { position: 'absolute', top: 0, left: 0, right: 0 },
  footer: { height: 48, alignItems: 'center', justifyContent: 'center' },
});

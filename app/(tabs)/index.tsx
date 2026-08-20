import { useCallback, useRef, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import { ActivityIndicator } from 'react-native-paper';

import { EmptyState } from '@/components/EmptyState';
import { ErrorBanner } from '@/components/ErrorBanner';
import { JobCard } from '@/components/JobCard';
import { JobSkeletonList } from '@/components/JobSkeleton';
import { JobsHeader } from '@/components/JobsHeader';
import { useT } from '@/lib/i18n/useT';
import { useJobsFeed } from '@/lib/hooks/useJobsFeed';
import { useTabBarLayout } from '@/lib/layout';
import { useColors } from '@/lib/theme';

export default function JobsScreen() {
  const t = useT();
  const colors = useColors();
  const headerHRef = useRef(88);
  const [headerH, setHeaderH] = useState(88);
  const endGuard = useRef(false);
  const feed = useJobsFeed();
  const tabBar = useTabBarLayout();

  const renderItem = useCallback(({ item }: { item: string }) => <JobCard jobId={item} />, []);
  const keyExtractor = useCallback((item: string) => item, []);
  const onHeaderLayout = useCallback((height: number) => {
    if (Math.abs(height - headerHRef.current) < 2) return;
    headerHRef.current = height;
    setHeaderH(height);
  }, []);

  const { visibleIds, loadingMore, loadMore } = feed;

  const onEndReached = useCallback(() => {
    if (endGuard.current || loadingMore || !visibleIds.length) return;
    endGuard.current = true;
    loadMore();
  }, [loadMore, loadingMore, visibleIds.length]);

  const unlockEnd = useCallback(() => {
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
        maxToRenderPerBatch={6}
        windowSize={9}
        updateCellsBatchingPeriod={80}
        removeClippedSubviews={false}
        onEndReachedThreshold={0.2}
        onEndReached={onEndReached}
        onScrollBeginDrag={unlockEnd}
        onMomentumScrollEnd={unlockEnd}
        refreshControl={
          <RefreshControl
            refreshing={feed.refreshing}
            tintColor={colors.accent}
            onRefresh={feed.refresh}
            progressViewOffset={headerH}
          />
        }
        ListHeaderComponent={
          feed.errors.length ? (
            <ErrorBanner errors={feed.errors} onRetry={feed.refresh} onDismiss={feed.dismissErrors} />
          ) : null
        }
        ListEmptyComponent={
          feed.loading ? (
            <JobSkeletonList />
          ) : (
            <EmptyState
              title={emptyError ? t('jobs.emptyError') : t('jobs.emptyTitle')}
              subtitle={emptyError ? t('jobs.emptyErrorHint') : t('jobs.emptyHint')}
              actionLabel={emptyError || !feed.filtersActive ? t('common.refresh') : t('common.resetFilters')}
              onAction={emptyError || !feed.filtersActive ? feed.refresh : feed.resetFilters}
            />
          )
        }
        ListFooterComponent={
          <View style={styles.footer}>{feed.loadingMore || feed.waitingBoards ? <ActivityIndicator /> : null}</View>
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
  list: { paddingHorizontal: 20 },
  headerWrap: { position: 'absolute', top: 0, left: 0, right: 0 },
  footer: { height: 48, alignItems: 'center', justifyContent: 'center' },
});

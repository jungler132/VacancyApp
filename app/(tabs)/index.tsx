import { useCallback, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, View } from 'react-native';

import { EmptyState } from '@/components/EmptyState';
import { FiltersSheet } from '@/components/FiltersSheet';
import { JobCard } from '@/components/JobCard';
import { JobSkeletonList } from '@/components/JobSkeleton';
import { JobsHeader } from '@/components/JobsHeader';
import { ScreenBackdrop } from '@/components/ScreenBackdrop';
import { useJobsFeed } from '@/lib/hooks/useJobsFeed';
import { colors } from '@/lib/theme';

export default function JobsScreen() {
  const headerHRef = useRef(112);
  const [headerH, setHeaderH] = useState(112);
  const feed = useJobsFeed();

  const renderItem = useCallback(({ item }: { item: string }) => <JobCard jobId={item} />, []);
  const keyExtractor = useCallback((item: string) => item, []);
  const onHeaderLayout = useCallback((height: number) => {
    if (Math.abs(height - headerHRef.current) < 2) return;
    headerHRef.current = height;
    setHeaderH(height);
  }, []);

  return (
    <View style={styles.screen}>
      <ScreenBackdrop />
      <FlatList
        data={feed.visibleIds}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        contentContainerStyle={[styles.list, { paddingTop: headerH + 8, paddingBottom: 108 }]}
        keyboardShouldPersistTaps="always"
        keyboardDismissMode="none"
        initialNumToRender={8}
        maxToRenderPerBatch={8}
        windowSize={7}
        updateCellsBatchingPeriod={50}
        removeClippedSubviews
        onEndReachedThreshold={0.4}
        onEndReached={feed.loadMore}
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
              title={feed.status === 'error' ? 'Не удалось загрузить' : 'Ничего не нашлось'}
              subtitle={
                feed.status === 'error'
                  ? 'Потяните вниз, чтобы повторить.'
                  : 'Смените регион, давность или источники.'
              }
            />
          )
        }
        ListFooterComponent={
          feed.loadingMore ? (
            <ActivityIndicator color={colors.accent} style={{ marginVertical: 16 }} />
          ) : (
            <View style={{ height: 8 }} />
          )
        }
      />

      <View style={styles.headerWrap} onLayout={(event) => onHeaderLayout(event.nativeEvent.layout.height)}>
        <JobsHeader
          maxAgeDays={feed.extra.maxAgeDays}
          fromCache={feed.fromCache}
          filtersActive={feed.filtersActive}
          onSearch={feed.setQuery}
          onChangeAge={feed.setMaxAgeDays}
          onOpenFilters={feed.openSheet}
          onResetCache={feed.resetCache}
        />
      </View>

      <FiltersSheet
        open={feed.sheetOpen}
        region={feed.region}
        categories={feed.categories}
        extra={feed.extra}
        onChangeRegion={feed.setRegion}
        onToggleCategory={feed.onToggleCategory}
        onChangeExtra={feed.setExtra}
        onClose={feed.closeSheet}
        onReset={feed.resetFilters}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  list: { paddingHorizontal: 16 },
  headerWrap: { position: 'absolute', top: 0, left: 0, right: 0 },
});

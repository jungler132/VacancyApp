import { useCallback } from 'react';
import { FlatList, View } from 'react-native';
import type { Href } from 'expo-router';

import { EmptyState } from '@/components/EmptyState';
import { JobCard } from '@/components/JobCard';
import { useT } from '@/lib/i18n/useT';
import { useLockedNav } from '@/lib/hooks/useLockedNav';
import { useAppSelector } from '@/lib/store/hooks';
import { useThemedStyles, type ThemeColors } from '@/lib/theme';

const JOBS_HREF = '/' as Href;

export default function TodayJobsScreen() {
  const t = useT();
  const nav = useLockedNav();
  const styles = useThemedStyles(todayStyles);
  const ids = useAppSelector((state) => state.jobs.todayIds);

  const renderItem = useCallback(({ item }: { item: string }) => <JobCard jobId={item} />, []);
  const keyExtractor = useCallback((item: string) => item, []);

  if (!ids.length) {
    return (
      <View style={styles.screen}>
        <EmptyState title={t('today.listEmpty')} actionLabel={t('tab.jobs')} onAction={() => nav.push(JOBS_HREF)} />
      </View>
    );
  }

  return (
    <FlatList
      data={ids}
      keyExtractor={keyExtractor}
      renderItem={renderItem}
      contentContainerStyle={styles.list}
      style={styles.screen}
      initialNumToRender={6}
      maxToRenderPerBatch={4}
      windowSize={5}
      updateCellsBatchingPeriod={50}
    />
  );
}

function todayStyles(colors: ThemeColors) {
  return {
    screen: { flex: 1, backgroundColor: colors.bg },
    list: { padding: 16, paddingBottom: 40, gap: 10 },
  };
}

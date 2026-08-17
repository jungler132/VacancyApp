import { useEffect, useState } from 'react';
import { useIsFocused } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';

import { FiltersButton } from '@/components/AppHeader';
import { EmptyState } from '@/components/EmptyState';
import { StatsBars } from '@/components/StatsBars';
import { StatsDonut } from '@/components/StatsDonut';
import { useJobsFeed } from '@/lib/hooks/useJobsFeed';
import { useAppSelector } from '@/lib/store/hooks';
import { selectJobStats } from '@/lib/store/selectors';
import { colors, radius } from '@/lib/theme';

export default function StatsScreen() {
  const focused = useIsFocused();
  const [chartsReady, setChartsReady] = useState(false);
  const feed = useJobsFeed();
  const stats = useAppSelector(selectJobStats);

  useEffect(() => {
    if (!focused || chartsReady) return;
    const frame = requestAnimationFrame(() => setChartsReady(true));
    return () => cancelAnimationFrame(frame);
  }, [focused, chartsReady]);

  return (
    <View style={styles.screen}>
      <View style={styles.toolbar}>
        <Text style={styles.note}>По текущим фильтрам ленты · {stats.total} вакансий</Text>
        <FiltersButton active={feed.filtersActive} onPress={feed.openSheet} />
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        {feed.loading && !stats.total ? (
          <EmptyState title="Считаем сводку" subtitle="Загружаем вакансии по выбранным фильтрам." />
        ) : !stats.total ? (
          <EmptyState
            title="Пока пусто"
            subtitle="Смените фильтры или обновите ленту вакансий."
            actionLabel={feed.filtersActive ? 'Сбросить фильтры' : 'Обновить'}
            onAction={feed.filtersActive ? feed.resetFilters : feed.refresh}
          />
        ) : (
          <>
            <View style={styles.kpis}>
              <View style={styles.kpi}>
                <Text variant="headlineSmall">{stats.total}</Text>
                <Text variant="bodySmall">вакансий</Text>
              </View>
              <View style={styles.kpi}>
                <Text variant="headlineSmall">{stats.remote}</Text>
                <Text variant="bodySmall">удалёнка</Text>
              </View>
              <View style={styles.kpi}>
                <Text variant="headlineSmall">{stats.withSalary}</Text>
                <Text variant="bodySmall">с зарплатой</Text>
              </View>
            </View>
            {chartsReady ? (
              <>
                <StatsDonut title="Источники" total={stats.total} slices={stats.sources} />
                <StatsBars title="Формат" total={stats.total} slices={stats.formats} />
                <StatsBars title="Давность" total={stats.total} slices={stats.ages} />
                <StatsBars title="Сферы" total={stats.total} slices={stats.categories} />
              </>
            ) : null}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
  },
  note: { flex: 1, color: colors.faint, fontSize: 13 },
  content: { padding: 16, paddingBottom: 40 },
  kpis: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  kpi: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: 12,
  },
});

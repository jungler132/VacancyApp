import { useIsFocused } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Button, Text } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { EmptyState } from '@/components/EmptyState';
import { ScreenBackdrop } from '@/components/ScreenBackdrop';
import { StatsDonut } from '@/components/StatsDonut';
import { useJobsFeed } from '@/lib/hooks/useJobsFeed';
import { useTabBarLayout } from '@/lib/layout';
import { useAppSelector } from '@/lib/store/hooks';
import { selectJobStats } from '@/lib/store/selectors';
import { colors } from '@/lib/theme';

export default function StatsScreen() {
  const insets = useSafeAreaInsets();
  const tabBar = useTabBarLayout();
  const focused = useIsFocused();
  const feed = useJobsFeed();
  const stats = useAppSelector(selectJobStats);

  return (
    <View style={styles.screen}>
      <ScreenBackdrop />
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <View style={styles.headCopy}>
          <Text variant="headlineSmall">Сводка</Text>
          <Text variant="bodySmall" style={styles.sub}>
            По текущим фильтрам ленты · {stats.total} вакансий
          </Text>
        </View>
        <Button
          mode={feed.filtersActive ? 'contained-tonal' : 'outlined'}
          compact
          icon="filter-variant"
          onPress={feed.openSheet}>
          Фильтры
        </Button>
      </View>
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: tabBar.listPaddingBottom }]}>
        {feed.loading && !stats.total ? (
          <EmptyState title="Считаем сводку" subtitle="Загружаем вакансии по выбранным фильтрам." />
        ) : !stats.total ? (
          <EmptyState title="Пока пусто" subtitle="Смените фильтры или обновите ленту вакансий." />
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
            {focused ? (
              <>
                <StatsDonut title="Источники" total={stats.total} slices={stats.sources} />
                <StatsDonut title="Формат" total={stats.total} slices={stats.formats} />
                <StatsDonut title="Давность" total={stats.total} slices={stats.ages} />
                <StatsDonut title="Сферы" total={stats.total} slices={stats.categories} />
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
  header: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.cardBorder,
  },
  headCopy: { flex: 1 },
  sub: { opacity: 0.7, marginTop: 2 },
  content: { padding: 16 },
  kpis: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  kpi: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: 8,
    padding: 12,
  },
});

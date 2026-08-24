import { useEffect, useState } from 'react';
import { useIsFocused } from 'expo-router';
import { ScrollView, View } from 'react-native';
import { Text } from 'react-native-paper';

import { FiltersButton } from '@/components/AppHeader';
import { EmptyState } from '@/components/EmptyState';
import { StatsBars } from '@/components/StatsBars';
import { StatsDonut } from '@/components/StatsDonut';
import { formatCount } from '@/lib/format';
import { useLocale, useT } from '@/lib/i18n/useT';
import { useJobsFeed } from '@/lib/hooks/useJobsFeed';
import { useAppSelector } from '@/lib/store/hooks';
import { selectJobStats } from '@/lib/store/selectors';
import { radius, useThemedStyles, type ColorSchemeName, type ThemeColors } from '@/lib/theme';

export default function StatsScreen() {
  const t = useT();
  const locale = useLocale();
  const styles = useThemedStyles(statsScreenStyles);
  const focused = useIsFocused();
  const [chartsReady, setChartsReady] = useState(false);
  const feed = useJobsFeed();
  const stats = useAppSelector(selectJobStats);
  const hasData = stats.total > 0;

  useEffect(() => {
    if (!focused || chartsReady) return;
    const frame = requestAnimationFrame(() => setChartsReady(true));
    return () => cancelAnimationFrame(frame);
  }, [focused, chartsReady]);

  return (
    <View style={styles.screen}>
      <View style={styles.toolbar}>
        <Text style={styles.note}>{t('stats.note')}</Text>
        <FiltersButton active={feed.filtersActive} onPress={feed.openSheet} />
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        {feed.loading && !hasData ? (
          <EmptyState title={t('stats.loading')} subtitle={t('stats.loadingHint')} />
        ) : !hasData ? (
          <EmptyState
            title={t('common.empty')}
            subtitle={t('stats.emptyHint')}
            actionLabel={feed.filtersActive ? t('common.resetFilters') : t('common.refresh')}
            onAction={feed.filtersActive ? feed.resetFilters : feed.refresh}
          />
        ) : (
          <>
            {typeof feed.boardTotal === 'number' ? (
              <View style={styles.boardCard}>
                <Text variant="headlineMedium">{formatCount(feed.boardTotal, locale)}</Text>
                <Text variant="bodySmall">{t('stats.jobs')}</Text>
              </View>
            ) : null}
            <View style={styles.kpis}>
              <View style={styles.kpi}>
                <Text variant="headlineSmall">{formatCount(stats.total, locale)}</Text>
                <Text variant="bodySmall">{t('stats.feed')}</Text>
              </View>
              <View style={styles.kpi}>
                <Text variant="headlineSmall">{formatCount(stats.remote, locale)}</Text>
                <Text variant="bodySmall">{t('stats.remote')}</Text>
              </View>
              <View style={styles.kpi}>
                <Text variant="headlineSmall">{formatCount(stats.withSalary, locale)}</Text>
                <Text variant="bodySmall">{t('stats.salary')}</Text>
              </View>
            </View>
            {chartsReady ? (
              <>
                <StatsDonut title={t('stats.sources')} total={stats.total} slices={stats.sources} />
                <StatsBars title={t('stats.format')} total={stats.total} slices={stats.formats} />
                <StatsBars title={t('stats.age')} total={stats.total} slices={stats.ages} />
                <StatsBars title={t('stats.categories')} total={stats.total} slices={stats.categories} />
              </>
            ) : null}
          </>
        )}
      </ScrollView>
    </View>
  );
}

function statsScreenStyles(colors: ThemeColors, _scheme: ColorSchemeName) {
  return {
    screen: { flex: 1, backgroundColor: colors.bg },
    toolbar: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: 8,
      paddingHorizontal: 16,
      paddingTop: 8,
      paddingBottom: 4,
    },
    note: { flex: 1, color: colors.faint, fontSize: 13 },
    content: { padding: 16, paddingBottom: 40 },
    kpis: { flexDirection: 'row' as const, gap: 8, marginBottom: 12 },
    kpi: {
      flex: 1,
      backgroundColor: colors.card,
      borderRadius: radius.lg,
      padding: 12,
    },
    boardCard: {
      backgroundColor: colors.card,
      borderRadius: radius.lg,
      padding: 14,
      marginBottom: 12,
    },
  };
}

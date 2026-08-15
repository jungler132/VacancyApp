import { useMemo } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Card, Switch, Text } from 'react-native-paper';

import { AppChip } from '@/components/AppChip';
import { AppHeader } from '@/components/AppHeader';
import { SOURCES, availableSourceIds } from '@/lib/api/aggregator';
import { useTabBarLayout } from '@/lib/layout';
import { useAppDispatch, useAppSelector } from '@/lib/store/hooks';
import { toggleSource } from '@/lib/store/sourcesSlice';
import { colors, radius } from '@/lib/theme';

const STATUS = {
  live: { label: 'онлайн' },
  key: { label: 'нужен ключ' },
  soon: { label: 'скоро' },
};

export default function SourcesScreen() {
  const dispatch = useAppDispatch();
  const tabBar = useTabBarLayout();
  const disabled = useAppSelector((state) => state.sources.disabledIds);
  const disabledSet = useMemo(() => new Set(disabled), [disabled]);
  const available = useMemo(() => new Set(availableSourceIds()), []);

  return (
    <View style={styles.screen}>
      <AppHeader title="Источники" />
      <ScrollView style={styles.scroll} contentContainerStyle={[styles.content, { paddingBottom: tabBar.listPaddingBottom }]}>
        <Text variant="bodyMedium" style={styles.lead}>
          Включайте только нужные площадки. Выключенные не запрашиваются.
        </Text>
        {SOURCES.map((source) => {
          const canToggle = available.has(source.id);
          const on = canToggle && !disabledSet.has(source.id);
          const tone = STATUS[source.status];
          return (
            <Card key={source.id} mode="contained" style={[styles.card, !on && canToggle ? styles.cardOff : null]}>
              <Card.Title
                title={source.name}
                subtitle={source.regionLabel}
                right={
                  canToggle
                    ? () => (
                        <Switch
                          value={on}
                          onValueChange={() => {
                            dispatch(toggleSource(source.id));
                          }}
                          style={styles.switch}
                        />
                      )
                    : undefined
                }
              />
              <Card.Content>
                <View style={styles.badge}>
                  <AppChip label={canToggle ? (on ? 'вкл' : 'выкл') : tone.label} selected={on} />
                </View>
                <Text variant="bodySmall" style={styles.note}>
                  {source.note}
                </Text>
              </Card.Content>
            </Card>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: 'transparent' },
  scroll: { flex: 1 },
  content: { padding: 16, gap: 10 },
  lead: { opacity: 0.8, marginBottom: 4 },
  card: { backgroundColor: colors.card, borderRadius: radius.lg, overflow: 'hidden' },
  cardOff: { opacity: 0.55 },
  switch: { marginRight: 8 },
  badge: { marginBottom: 8 },
  note: { opacity: 0.8 },
});

import { useMemo } from 'react';
import { ScrollView, StyleSheet, Switch, Text, View } from 'react-native';

import { ScreenBackdrop } from '@/components/ScreenBackdrop';
import { SOURCES, availableSourceIds } from '@/lib/api/aggregator';
import { useAppDispatch, useAppSelector } from '@/lib/store/hooks';
import { toggleSource } from '@/lib/store/sourcesSlice';
import { colors, fonts, radius } from '@/lib/theme';

const STATUS = {
  live: { label: 'онлайн', color: colors.accent, border: '#245C48' },
  key: { label: 'нужен ключ', color: colors.orange, border: '#6B4E16' },
  soon: { label: 'скоро', color: colors.blue, border: '#2A3B55' },
};

export default function SourcesScreen() {
  const dispatch = useAppDispatch();
  const disabled = useAppSelector((state) => state.sources.disabledIds);
  const disabledSet = useMemo(() => new Set(disabled), [disabled]);
  const available = useMemo(() => new Set(availableSourceIds()), []);

  return (
    <View style={styles.screen}>
      <ScreenBackdrop />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <Text style={styles.lead}>Включайте только нужные площадки. Выключенные не запрашиваются.</Text>
        {SOURCES.map((source) => {
          const canToggle = available.has(source.id);
          const on = canToggle && !disabledSet.has(source.id);
          const tone = STATUS[source.status];
          return (
            <View key={source.id} style={[styles.card, !on && canToggle ? styles.cardOff : null]}>
              <View style={styles.row}>
                <View style={styles.copy}>
                  <Text style={styles.name}>{source.name}</Text>
                  <Text style={[styles.badge, { color: tone.color, borderColor: tone.border }]}>
                    {canToggle ? (on ? 'вкл' : 'выкл') : tone.label}
                  </Text>
                </View>
                {canToggle ? (
                  <Switch
                    value={on}
                    onValueChange={() => {
                      dispatch(toggleSource(source.id));
                    }}
                    trackColor={{ false: '#2A3344', true: colors.accent }}
                    thumbColor="#F4F7FB"
                  />
                ) : null}
              </View>
              <Text style={styles.region}>{source.regionLabel}</Text>
              <Text style={styles.note}>{source.note}</Text>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  scroll: { flex: 1 },
  content: { padding: 16, paddingBottom: 108, gap: 10 },
  lead: { color: colors.muted, lineHeight: 20, marginBottom: 4, fontFamily: fonts.regular },
  card: {
    backgroundColor: colors.card,
    borderColor: colors.cardBorder,
    borderWidth: 1,
    borderRadius: radius.md,
    padding: 14,
  },
  cardOff: { opacity: 0.55 },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, alignItems: 'center' },
  copy: { flex: 1, gap: 8 },
  name: { color: colors.text, fontFamily: fonts.bold, fontSize: 16 },
  badge: {
    alignSelf: 'flex-start',
    fontSize: 11,
    fontFamily: fonts.bold,
    textTransform: 'uppercase',
    borderWidth: 1.5,
    borderRadius: radius.sm,
    paddingHorizontal: 8,
    paddingVertical: 4,
    overflow: 'hidden',
  },
  region: { color: colors.accent, marginTop: 6, fontSize: 12, fontFamily: fonts.semibold },
  note: { color: colors.muted, marginTop: 6, lineHeight: 18, fontFamily: fonts.regular },
});

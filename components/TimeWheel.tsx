import { memo, useCallback, useMemo, useRef } from 'react';
import { ScrollView, View, type NativeScrollEvent, type NativeSyntheticEvent } from 'react-native';

import { Text } from '@/components/AppText';
import { composeClock, HOUR_VALUES, MINUTE_VALUES, parseClock } from '@/lib/services/hours';
import { fonts, radius, useThemedStyles, type ThemeColors } from '@/lib/theme';

const ITEM_H = 44;
const VISIBLE = 5;
const PAD = ((VISIBLE - 1) / 2) * ITEM_H;

export const TimeWheel = memo(function TimeWheel({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const styles = useThemedStyles(timeWheelStyles);
  const parsed = useMemo(() => parseClock(value), [value]);

  const onHour = useCallback(
    (hour: string) => {
      const next = composeClock(hour, parsed.minute);
      if (next !== parsed.clock) onChange(next);
    },
    [onChange, parsed.clock, parsed.minute],
  );
  const onMinute = useCallback(
    (minute: string) => {
      const next = composeClock(parsed.hour, minute);
      if (next !== parsed.clock) onChange(next);
    },
    [onChange, parsed.clock, parsed.hour],
  );

  return (
    <View style={styles.card}>
      <View style={styles.band} pointerEvents="none" />
      <WheelColumn items={HOUR_VALUES} value={parsed.hour} onChange={onHour} />
      <View style={styles.colonWrap} pointerEvents="none">
        <Text style={styles.colon}>:</Text>
      </View>
      <WheelColumn items={MINUTE_VALUES} value={parsed.minute} onChange={onMinute} />
    </View>
  );
});

const WheelColumn = memo(function WheelColumn({
  items,
  value,
  onChange,
}: {
  items: string[];
  value: string;
  onChange: (value: string) => void;
}) {
  const styles = useThemedStyles(timeWheelStyles);
  const ref = useRef<ScrollView>(null);
  const offsets = useMemo(() => items.map((_, i) => i * ITEM_H), [items]);
  const index = Math.max(0, items.indexOf(value));
  const startY = useRef(index * ITEM_H);
  const primed = useRef(false);

  const sync = useCallback(() => {
    ref.current?.scrollTo({ y: index * ITEM_H, animated: false });
  }, [index]);

  const onLayout = useCallback(() => {
    if (primed.current) return;
    primed.current = true;
    sync();
  }, [sync]);

  const commit = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const nextIndex = Math.max(0, Math.min(items.length - 1, Math.round(event.nativeEvent.contentOffset.y / ITEM_H)));
      const next = items[nextIndex];
      if (next && next !== value) onChange(next);
    },
    [items, onChange, value],
  );

  const onEndDrag = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      if (Math.abs(event.nativeEvent.velocity?.y ?? 0) < 0.08) commit(event);
    },
    [commit],
  );

  return (
    <ScrollView
      ref={ref}
      nestedScrollEnabled
      showsVerticalScrollIndicator={false}
      snapToOffsets={offsets}
      snapToAlignment="start"
      decelerationRate="fast"
      disableIntervalMomentum
      onMomentumScrollEnd={commit}
      onScrollEndDrag={onEndDrag}
      style={styles.column}
      contentContainerStyle={styles.columnContent}
      contentOffset={{ x: 0, y: startY.current }}
      onLayout={onLayout}>
      {items.map((item) => (
        <View key={item} style={styles.item}>
          <Text style={[styles.itemText, item === value && styles.itemOn]}>{item}</Text>
        </View>
      ))}
    </ScrollView>
  );
});

function timeWheelStyles(colors: ThemeColors) {
  return {
    card: {
      height: ITEM_H * VISIBLE,
      flexDirection: 'row' as const,
      alignItems: 'stretch' as const,
      justifyContent: 'center' as const,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.chipBorder,
      backgroundColor: colors.card,
      overflow: 'hidden' as const,
    },
    band: {
      position: 'absolute' as const,
      left: 8,
      right: 8,
      top: PAD,
      height: ITEM_H,
      borderRadius: radius.sm,
      backgroundColor: colors.accentDim,
    },
    column: { flex: 1, backgroundColor: 'transparent' },
    columnContent: { paddingVertical: PAD },
    item: { height: ITEM_H, alignItems: 'center' as const, justifyContent: 'center' as const },
    itemText: { color: colors.faint, fontFamily: fonts.medium, fontSize: 18, lineHeight: 24 },
    itemOn: { color: colors.text, fontFamily: fonts.semibold },
    colonWrap: { width: 14, alignItems: 'center' as const, justifyContent: 'center' as const },
    colon: { color: colors.text, fontFamily: fonts.semibold, fontSize: 18, lineHeight: 24 },
  };
}

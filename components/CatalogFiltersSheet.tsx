import { memo, useCallback, useEffect } from 'react';
import { Dimensions, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { SelectChip } from '@/components/FilterChips';
import { Text } from '@/components/AppText';
import {
  CATALOG_REGION_FILTERS,
  catalogFiltersActive,
  countriesForRegion,
  type CatalogCountryId,
  type CatalogFilters,
} from '@/lib/telegramGroups';
import { colors, fonts, radius } from '@/lib/theme';

const SHEET_TRAVEL = Dimensions.get('window').height;
const OPEN_CFG = { duration: 220, easing: Easing.out(Easing.cubic) };
const CLOSE_CFG = { duration: 180, easing: Easing.in(Easing.cubic) };

export const CatalogFiltersSheet = memo(function CatalogFiltersSheet({
  open,
  filters,
  resultCount,
  onChange,
  onClose,
  onReset,
}: {
  open: boolean;
  filters: CatalogFilters;
  resultCount: number;
  onChange: (next: CatalogFilters) => void;
  onClose: () => void;
  onReset: () => void;
}) {
  const insets = useSafeAreaInsets();
  const progress = useSharedValue(0);
  const dirty = catalogFiltersActive(filters);
  const countries = countriesForRegion(filters.region);

  useEffect(() => {
    progress.value = withTiming(open ? 1 : 0, open ? OPEN_CFG : CLOSE_CFG);
  }, [open, progress]);

  const close = useCallback(() => {
    if (open) onClose();
  }, [onClose, open]);

  const onRegion = useCallback(
    (id: string | number) => {
      onChange({ region: id as CatalogFilters['region'], country: 'all' });
    },
    [onChange],
  );

  const onCountry = useCallback(
    (id: string | number) => {
      onChange({ ...filters, country: id as CatalogCountryId | 'all' });
    },
    [filters, onChange],
  );

  const backdropStyle = useAnimatedStyle(() => ({ opacity: progress.value }));
  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: (1 - progress.value) * SHEET_TRAVEL }],
  }));

  return (
    <View pointerEvents={open ? 'auto' : 'none'} style={styles.root}>
      <Pressable style={StyleSheet.absoluteFill} onPress={close}>
        <Animated.View style={[styles.backdrop, backdropStyle]} />
      </Pressable>
      <Animated.View style={[styles.sheet, sheetStyle, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <View style={styles.handle} />
        <View style={styles.head}>
          <Text style={styles.title}>Фильтры</Text>
          {dirty ? (
            <Pressable onPress={onReset} hitSlop={8}>
              <Text style={styles.reset}>Сбросить</Text>
            </Pressable>
          ) : null}
        </View>
        <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <Text style={styles.section}>Регион</Text>
          <View style={styles.wrap}>
            {CATALOG_REGION_FILTERS.map((item) => (
              <SelectChip
                key={item.id}
                id={item.id}
                label={item.label}
                selected={filters.region === item.id}
                onChange={onRegion}
              />
            ))}
          </View>
          {countries.length > 1 ? (
            <>
              <Text style={styles.section}>Страна</Text>
              <View style={styles.wrap}>
                <SelectChip id="all" label="Все" selected={filters.country === 'all'} onChange={onCountry} />
                {countries.map((item) => (
                  <SelectChip
                    key={item.id}
                    id={item.id}
                    label={item.label}
                    selected={filters.country === item.id}
                    onChange={onCountry}
                  />
                ))}
              </View>
            </>
          ) : null}
        </ScrollView>
        <Pressable onPress={close} style={styles.done}>
          <Text style={styles.doneText}>Показать {resultCount}</Text>
        </Pressable>
      </Animated.View>
    </View>
  );
});

const styles = StyleSheet.create({
  root: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    justifyContent: 'flex-end',
    zIndex: 50,
    elevation: 50,
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  sheet: {
    backgroundColor: '#121A28',
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingHorizontal: 18,
    paddingTop: 8,
    maxHeight: '82%',
  },
  handle: {
    alignSelf: 'center',
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.18)',
    marginBottom: 12,
  },
  head: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  title: { color: colors.text, fontSize: 20, fontFamily: fonts.bold },
  reset: { color: colors.accent, fontFamily: fonts.semibold, fontSize: 14 },
  section: {
    color: colors.muted,
    fontFamily: fonts.semibold,
    fontSize: 12,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    marginTop: 16,
    marginBottom: 10,
  },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  done: {
    marginTop: 16,
    backgroundColor: colors.accent,
    borderRadius: radius.md,
    paddingVertical: 14,
    alignItems: 'center',
  },
  doneText: { color: colors.accentText, fontFamily: fonts.bold, fontSize: 16 },
});

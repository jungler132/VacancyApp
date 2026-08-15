import { memo, useCallback, useEffect } from 'react';
import { Dimensions, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { SelectChip } from '@/components/FilterChips';
import { CATEGORIES, REGIONS } from '@/lib/catalog';
import {
  AGE_PRESETS,
  SALARY_PRESETS,
  extraFiltersActive,
  type ExtraFilters,
  type EmploymentFilter,
  type WorkFormat,
} from '@/lib/filters';
import type { CategoryId, RegionId } from '@/lib/types';
import { colors, fonts, radius } from '@/lib/theme';

const FORMATS: { id: WorkFormat; label: string }[] = [
  { id: 'any', label: 'Любой' },
  { id: 'remote', label: 'Удалёнка' },
  { id: 'office', label: 'Офис' },
];

const EMPLOYMENT: { id: EmploymentFilter; label: string }[] = [
  { id: 'any', label: 'Любой' },
  { id: 'full', label: 'Полная' },
  { id: 'part', label: 'Частичная' },
  { id: 'shift', label: 'Вахта' },
];

const SHEET_TRAVEL = Dimensions.get('window').height;
const OPEN_CFG = { duration: 220, easing: Easing.out(Easing.cubic) };
const CLOSE_CFG = { duration: 180, easing: Easing.in(Easing.cubic) };

export const FiltersSheet = memo(function FiltersSheet({
  open,
  region,
  categories,
  extra,
  onChangeRegion,
  onToggleCategory,
  onChangeExtra,
  onClose,
  onReset,
}: {
  open: boolean;
  region: RegionId;
  categories: CategoryId[];
  extra: ExtraFilters;
  onChangeRegion: (id: RegionId) => void;
  onToggleCategory: (id: CategoryId) => void;
  onChangeExtra: (next: ExtraFilters) => void;
  onClose: () => void;
  onReset: () => void;
}) {
  const insets = useSafeAreaInsets();
  const progress = useSharedValue(0);
  const dirty =
    extraFiltersActive(extra) || categories.length > 1 || categories[0] !== 'all' || region !== 'cis';

  useEffect(() => {
    progress.value = withTiming(open ? 1 : 0, open ? OPEN_CFG : CLOSE_CFG);
  }, [open, progress]);

  const close = useCallback(() => {
    if (open) onClose();
  }, [onClose, open]);

  const onAge = useCallback(
    (id: string | number) => onChangeExtra({ ...extra, maxAgeDays: id as ExtraFilters['maxAgeDays'] }),
    [extra, onChangeExtra],
  );
  const onSalary = useCallback(
    (id: string | number) => {
      const next = SALARY_PRESETS.find((item) => item.id === id);
      if (next) onChangeExtra({ ...extra, salaryMin: next.value });
    },
    [extra, onChangeExtra],
  );
  const onFormat = useCallback(
    (id: string | number) => onChangeExtra({ ...extra, format: id as WorkFormat }),
    [extra, onChangeExtra],
  );
  const onEmployment = useCallback(
    (id: string | number) => onChangeExtra({ ...extra, employment: id as EmploymentFilter }),
    [extra, onChangeExtra],
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
            {REGIONS.map((item) => (
              <SelectChip
                key={item.id}
                id={item.id}
                label={item.label}
                selected={region === item.id}
                onChange={onChangeRegion as (id: string | number) => void}
              />
            ))}
          </View>
          <Text style={styles.section}>Сферы</Text>
          <View style={styles.wrap}>
            {CATEGORIES.map((item) => (
              <SelectChip
                key={item.id}
                id={item.id}
                label={item.label}
                icon={item.icon}
                selected={categories.includes(item.id)}
                onChange={onToggleCategory as (id: string | number) => void}
              />
            ))}
          </View>
          <Text style={styles.section}>Давность</Text>
          <View style={styles.wrap}>
            {AGE_PRESETS.map((item) => (
              <SelectChip
                key={item.id}
                id={item.id}
                label={item.label}
                selected={extra.maxAgeDays === item.id}
                onChange={onAge}
              />
            ))}
          </View>
          <Text style={styles.section}>Зарплата</Text>
          <View style={styles.wrap}>
            {SALARY_PRESETS.map((item) => (
              <SelectChip
                key={item.id}
                id={item.id}
                label={item.label}
                selected={extra.salaryMin === item.value}
                onChange={onSalary}
              />
            ))}
          </View>
          <Text style={styles.section}>Формат</Text>
          <View style={styles.wrap}>
            {FORMATS.map((item) => (
              <SelectChip
                key={item.id}
                id={item.id}
                label={item.label}
                selected={extra.format === item.id}
                onChange={onFormat}
              />
            ))}
          </View>
          <Text style={styles.section}>Занятость</Text>
          <View style={styles.wrap}>
            {EMPLOYMENT.map((item) => (
              <SelectChip
                key={item.id}
                id={item.id}
                label={item.label}
                selected={extra.employment === item.id}
                onChange={onEmployment}
              />
            ))}
          </View>
        </ScrollView>
        <Pressable onPress={close} style={styles.done}>
          <Text style={styles.doneText}>Готово</Text>
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
    borderRadius: 6,
    paddingVertical: 14,
    alignItems: 'center',
  },
  doneText: { color: colors.accentText, fontFamily: fonts.bold, fontSize: 16 },
});

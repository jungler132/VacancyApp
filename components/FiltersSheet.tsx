import { memo } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

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
  const dirty =
    extraFiltersActive(extra) || categories.length > 1 || categories[0] !== 'all' || region !== 'cis';

  return (
    <Modal visible={open} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.root}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          <View style={styles.handle} />
          <View style={styles.head}>
            <Text style={styles.title}>Фильтры</Text>
            {dirty ? (
              <Pressable onPress={onReset} hitSlop={8}>
                <Text style={styles.reset}>Сбросить</Text>
              </Pressable>
            ) : null}
          </View>
          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={styles.section}>Регион</Text>
            <View style={styles.wrap}>
              {REGIONS.map((item) => {
                const active = region === item.id;
                return (
                  <Pressable
                    key={item.id}
                    onPress={() => onChangeRegion(item.id)}
                    style={[styles.chip, active && styles.chipOn]}>
                    <Text style={[styles.chipText, active && styles.chipTextOn]}>{item.label}</Text>
                  </Pressable>
                );
              })}
            </View>
            <Text style={styles.section}>Сферы</Text>
            <View style={styles.wrap}>
              {CATEGORIES.map((item) => {
                const active = categories.includes(item.id);
                return (
                  <Pressable
                    key={item.id}
                    onPress={() => onToggleCategory(item.id)}
                    style={[styles.chip, active && styles.chipOn]}>
                    <Text style={styles.icon}>{item.icon}</Text>
                    <Text style={[styles.chipText, active && styles.chipTextOn]}>{item.label}</Text>
                  </Pressable>
                );
              })}
            </View>
            <Text style={styles.section}>Давность</Text>
            <View style={styles.wrap}>
              {AGE_PRESETS.map((item) => {
                const active = extra.maxAgeDays === item.id;
                return (
                  <Pressable
                    key={item.id}
                    onPress={() => onChangeExtra({ ...extra, maxAgeDays: item.id })}
                    style={[styles.chip, active && styles.chipOn]}>
                    <Text style={[styles.chipText, active && styles.chipTextOn]}>{item.label}</Text>
                  </Pressable>
                );
              })}
            </View>
            <Text style={styles.section}>Зарплата</Text>
            <View style={styles.wrap}>
              {SALARY_PRESETS.map((item) => {
                const active = extra.salaryMin === item.value;
                return (
                  <Pressable
                    key={item.id}
                    onPress={() => onChangeExtra({ ...extra, salaryMin: item.value })}
                    style={[styles.chip, active && styles.chipOn]}>
                    <Text style={[styles.chipText, active && styles.chipTextOn]}>{item.label}</Text>
                  </Pressable>
                );
              })}
            </View>
            <Text style={styles.section}>Формат</Text>
            <View style={styles.wrap}>
              {FORMATS.map((item) => {
                const active = extra.format === item.id;
                return (
                  <Pressable
                    key={item.id}
                    onPress={() => onChangeExtra({ ...extra, format: item.id })}
                    style={[styles.chip, active && styles.chipOn]}>
                    <Text style={[styles.chipText, active && styles.chipTextOn]}>{item.label}</Text>
                  </Pressable>
                );
              })}
            </View>
            <Text style={styles.section}>Занятость</Text>
            <View style={styles.wrap}>
              {EMPLOYMENT.map((item) => {
                const active = extra.employment === item.id;
                return (
                  <Pressable
                    key={item.id}
                    onPress={() => onChangeExtra({ ...extra, employment: item.id })}
                    style={[styles.chip, active && styles.chipOn]}>
                    <Text style={[styles.chipText, active && styles.chipTextOn]}>{item.label}</Text>
                  </Pressable>
                );
              })}
            </View>
          </ScrollView>
          <Pressable style={styles.done} onPress={onClose}>
            <Text style={styles.doneText}>Готово</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
});

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(0,0,0,0.45)' },
  sheet: {
    backgroundColor: '#121A28',
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingHorizontal: 18,
    paddingTop: 8,
    maxHeight: '82%',
    borderWidth: 1,
    borderColor: colors.cardBorder,
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
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: colors.chipBorder,
    backgroundColor: colors.chip,
    borderRadius: radius.md,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  chipOn: { backgroundColor: colors.accentDim, borderColor: colors.accent },
  icon: { fontSize: 12 },
  chipText: { color: colors.muted, fontFamily: fonts.semibold, fontSize: 13 },
  chipTextOn: { color: colors.accent },
  done: {
    marginTop: 16,
    backgroundColor: colors.accent,
    borderRadius: radius.md,
    paddingVertical: 14,
    alignItems: 'center',
  },
  doneText: { color: colors.accentText, fontFamily: fonts.bold, fontSize: 16 },
});

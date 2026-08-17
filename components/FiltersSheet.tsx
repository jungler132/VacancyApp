import { memo, useCallback } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { FilterSheetFrame, FilterSheetSection } from '@/components/FilterSheetFrame';
import { SelectChip } from '@/components/FilterChips';
import { Text } from '@/components/AppText';
import { CATEGORIES, REGIONS } from '@/lib/catalog';
import {
  AGE_PRESETS,
  DEFAULT_EXTRA_FILTERS,
  SALARY_PRESETS,
  extraFiltersActive,
  type ExtraFilters,
  type EmploymentFilter,
  type WorkFormat,
} from '@/lib/filters';
import type { CategoryId, RegionId } from '@/lib/types';
import { colors, fonts, radius } from '@/lib/theme';
import { keyOf } from '@/lib/i18n';
import { useT } from '@/lib/i18n/useT';

const FORMATS: WorkFormat[] = ['any', 'remote', 'office'];
const EMPLOYMENT: EmploymentFilter[] = ['any', 'full', 'part', 'shift'];

export const FiltersSheet = memo(function FiltersSheet({
  open,
  region,
  categories,
  extra,
  resultCount,
  watching,
  watches,
  onToggleWatch,
  onOpenWatch,
  onRemoveWatch,
  onToggleWatchEnabled,
  onChangeRegion,
  onToggleCategory,
  onChangeExtra,
  onClose,
  onReset,
}: {
  open: boolean;
  region: RegionId;
  categories: CategoryId[];
  extra?: ExtraFilters | null;
  resultCount?: number | null;
  watching?: boolean;
  watches?: { id: string; label: string; enabled: boolean }[];
  onToggleWatch?: () => void;
  onOpenWatch?: (id: string) => void;
  onRemoveWatch?: (id: string) => void;
  onToggleWatchEnabled?: (id: string) => void;
  onChangeRegion: (id: RegionId) => void;
  onToggleCategory: (id: CategoryId) => void;
  onChangeExtra: (next: ExtraFilters) => void;
  onClose: () => void;
  onReset: () => void;
}) {
  const t = useT();
  const current = extra ?? DEFAULT_EXTRA_FILTERS;
  const dirty =
    extraFiltersActive(current) || categories.length > 1 || categories[0] !== 'all' || region !== 'all';
  const doneLabel = resultCount == null ? t('common.show') : t('filters.showJobs', { count: resultCount });

  const onAge = useCallback(
    (id: string | number) => onChangeExtra({ ...current, maxAgeDays: id as ExtraFilters['maxAgeDays'] }),
    [current, onChangeExtra],
  );
  const onSalary = useCallback(
    (id: string | number) => {
      const next = SALARY_PRESETS.find((item) => item.id === id);
      if (next) onChangeExtra({ ...current, salaryMin: next.value });
    },
    [current, onChangeExtra],
  );
  const onFormat = useCallback(
    (id: string | number) => onChangeExtra({ ...current, format: id as WorkFormat }),
    [current, onChangeExtra],
  );
  const onEmployment = useCallback(
    (id: string | number) => onChangeExtra({ ...current, employment: id as EmploymentFilter }),
    [current, onChangeExtra],
  );

  return (
    <FilterSheetFrame
      open={open}
      dirty={dirty}
      title={t('filters.title')}
      resetLabel={t('common.reset')}
      doneLabel={doneLabel}
      onClose={onClose}
      onReset={onReset}
      footer={
        <>
          {onToggleWatch ? (
            <Pressable onPress={onToggleWatch} style={[styles.watch, watching && styles.watchOn]}>
              <Text style={[styles.watchText, watching && styles.watchTextOn]}>
                {watching ? t('filters.watchOn') : t('filters.watchOff')}
              </Text>
            </Pressable>
          ) : null}
          {watches?.length ? (
            <View style={styles.watchList}>
              {watches.map((item) => (
                <WatchRow
                  key={item.id}
                  id={item.id}
                  label={item.label}
                  enabled={item.enabled}
                  onOpen={onOpenWatch}
                  onToggle={onToggleWatchEnabled}
                  onRemove={onRemoveWatch}
                />
              ))}
            </View>
          ) : null}
        </>
      }>
      <FilterSheetSection title={t('filters.region')}>
        {REGIONS.map((item) => (
          <SelectChip
            key={item.id}
            id={item.id}
            label={t(keyOf('region', item.id))}
            selected={region === item.id}
            onChange={onChangeRegion as (id: string | number) => void}
          />
        ))}
      </FilterSheetSection>
      <FilterSheetSection title={t('filters.category')}>
        {CATEGORIES.map((item) => (
          <SelectChip
            key={item.id}
            id={item.id}
            label={t(keyOf('category', item.id))}
            icon={item.icon}
            selected={categories.includes(item.id)}
            onChange={onToggleCategory as (id: string | number) => void}
          />
        ))}
      </FilterSheetSection>
      <FilterSheetSection title={t('filters.age')}>
        {AGE_PRESETS.map((item) => (
          <SelectChip key={item.id} id={item.id} label={t(keyOf('filters.age', item.id))} selected={current.maxAgeDays === item.id} onChange={onAge} />
        ))}
      </FilterSheetSection>
      <FilterSheetSection title={t('filters.salary')}>
        {SALARY_PRESETS.map((item) => (
          <SelectChip
            key={item.id}
            id={item.id}
            label={
              item.value == null ? t('filters.salary.any') : t('filters.salary.from', { amount: String(item.value) })
            }
            selected={current.salaryMin === item.value}
            onChange={onSalary}
          />
        ))}
      </FilterSheetSection>
      <FilterSheetSection title={t('filters.format')}>
        {FORMATS.map((id) => (
          <SelectChip key={id} id={id} label={t(keyOf('filters.format', id))} selected={current.format === id} onChange={onFormat} />
        ))}
      </FilterSheetSection>
      <FilterSheetSection title={t('filters.employment')}>
        {EMPLOYMENT.map((id) => (
          <SelectChip
            key={id}
            id={id}
            label={t(keyOf('filters.employment', id))}
            selected={current.employment === id}
            onChange={onEmployment}
          />
        ))}
      </FilterSheetSection>
    </FilterSheetFrame>
  );
});

const WatchRow = memo(function WatchRow({
  id,
  label,
  enabled,
  onOpen,
  onToggle,
  onRemove,
}: {
  id: string;
  label: string;
  enabled: boolean;
  onOpen?: (id: string) => void;
  onToggle?: (id: string) => void;
  onRemove?: (id: string) => void;
}) {
  const t = useT();
  const open = useCallback(() => onOpen?.(id), [id, onOpen]);
  const toggle = useCallback(() => onToggle?.(id), [id, onToggle]);
  const remove = useCallback(() => onRemove?.(id), [id, onRemove]);

  return (
    <View style={styles.watchRow}>
      <Pressable onPress={open} style={styles.watchBody}>
        <Text style={styles.watchLabel} numberOfLines={2}>
          {label}
        </Text>
        <Text style={styles.watchMeta}>{enabled ? t('filters.watchEnabled') : t('filters.watchPaused')}</Text>
      </Pressable>
      <Pressable onPress={toggle} hitSlop={8}>
        <Text style={styles.watchAction}>{enabled ? t('filters.pause') : t('filters.enable')}</Text>
      </Pressable>
      <Pressable onPress={remove} hitSlop={8}>
        <Text style={styles.watchRemove}>{t('common.delete')}</Text>
      </Pressable>
    </View>
  );
});

const styles = StyleSheet.create({
  watch: {
    marginTop: 14,
    borderWidth: 1,
    borderColor: colors.chipBorder,
    borderRadius: radius.md,
    paddingVertical: 12,
    alignItems: 'center',
  },
  watchOn: { backgroundColor: colors.accentDim, borderColor: colors.accent },
  watchText: { color: colors.muted, fontFamily: fonts.semibold, fontSize: 14 },
  watchTextOn: { color: colors.accent },
  watchList: { marginTop: 12, gap: 8 },
  watchRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  watchBody: { flex: 1, minWidth: 0 },
  watchLabel: { color: colors.text, fontFamily: fonts.medium, fontSize: 13 },
  watchMeta: { color: colors.faint, fontSize: 11, marginTop: 2 },
  watchAction: { color: colors.accent, fontFamily: fonts.semibold, fontSize: 12 },
  watchRemove: { color: colors.danger, fontFamily: fonts.semibold, fontSize: 12 },
});

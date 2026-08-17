import { memo, useCallback } from 'react';

import { FilterSheetFrame, FilterSheetSection } from '@/components/FilterSheetFrame';
import { SelectChip } from '@/components/FilterChips';
import { keyOf } from '@/lib/i18n';
import { useT } from '@/lib/i18n/useT';
import {
  CATALOG_REGION_FILTERS,
  catalogFiltersActive,
  countriesForRegion,
  type CatalogCountryId,
  type CatalogFilters,
} from '@/lib/telegramGroups';

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
  const t = useT();
  const dirty = catalogFiltersActive(filters);
  const countries = countriesForRegion(filters.region);

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

  return (
    <FilterSheetFrame
      open={open}
      dirty={dirty}
      title={t('filters.title')}
      resetLabel={t('common.reset')}
      doneLabel={t('filters.showCount', { count: resultCount })}
      onClose={onClose}
      onReset={onReset}>
      <FilterSheetSection title={t('catalog.section.region')}>
        {CATALOG_REGION_FILTERS.map((item) => (
          <SelectChip
            key={item.id}
            id={item.id}
            label={item.id === 'all' ? t('common.all') : t(keyOf('region', item.id))}
            selected={filters.region === item.id}
            onChange={onRegion}
          />
        ))}
      </FilterSheetSection>
      {countries.length > 1 ? (
        <FilterSheetSection title={t('catalog.section.country')}>
          <SelectChip id="all" label={t('common.all')} selected={filters.country === 'all'} onChange={onCountry} />
          {countries.map((item) => (
            <SelectChip
              key={item.id}
              id={item.id}
              label={t(keyOf('country', item.id))}
              selected={filters.country === item.id}
              onChange={onCountry}
            />
          ))}
        </FilterSheetSection>
      ) : null}
    </FilterSheetFrame>
  );
});

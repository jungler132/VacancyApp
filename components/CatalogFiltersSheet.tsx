import { memo, useCallback } from 'react';

import { FilterSheetFrame, FilterSheetSection } from '@/components/FilterSheetFrame';
import { SelectChip } from '@/components/FilterChips';
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
      doneLabel={`Показать ${resultCount}`}
      onClose={onClose}
      onReset={onReset}>
      <FilterSheetSection title="Регион">
        {CATALOG_REGION_FILTERS.map((item) => (
          <SelectChip
            key={item.id}
            id={item.id}
            label={item.label}
            selected={filters.region === item.id}
            onChange={onRegion}
          />
        ))}
      </FilterSheetSection>
      {countries.length > 1 ? (
        <FilterSheetSection title="Страна">
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
        </FilterSheetSection>
      ) : null}
    </FilterSheetFrame>
  );
});

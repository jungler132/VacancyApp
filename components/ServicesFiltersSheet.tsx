import { memo, useCallback } from 'react';

import { FilterSheetFrame, FilterSheetSection } from '@/components/FilterSheetFrame';
import { SelectChip } from '@/components/FilterChips';
import { PlacePicker } from '@/components/PlacePicker';
import { keyOf } from '@/lib/i18n';
import { useT } from '@/lib/i18n/useT';
import { SERVICE_KIND_FILTERS } from '@/lib/services/kinds';
import type { ServiceKindId } from '@/lib/services/types';

export const ServicesFiltersSheet = memo(function ServicesFiltersSheet({
  open,
  kind,
  placeId,
  resultCount,
  onChangeKind,
  onChangePlace,
  onClose,
  onReset,
}: {
  open: boolean;
  kind: ServiceKindId | 'all';
  placeId: string;
  resultCount: number;
  onChangeKind: (id: ServiceKindId | 'all') => void;
  onChangePlace: (id: string) => void;
  onClose: () => void;
  onReset: () => void;
}) {
  const t = useT();
  const onKind = useCallback(
    (id: string | number) => {
      const next = String(id) as ServiceKindId | 'all';
      if (next === 'all' || next === kind) {
        onChangeKind('all');
        return;
      }
      onChangeKind(next);
    },
    [kind, onChangeKind],
  );

  return (
    <FilterSheetFrame
      open={open}
      dirty={kind !== 'all' || Boolean(placeId)}
      title={t('filters.title')}
      resetLabel={t('common.reset')}
      doneLabel={t('filters.showCount', { count: resultCount })}
      onClose={onClose}
      onReset={onReset}>
      <FilterSheetSection title={t('services.kind')}>
        {SERVICE_KIND_FILTERS.map((item) => (
          <SelectChip
            key={item.id}
            id={item.id}
            label={t(keyOf('kind', item.id))}
            icon={item.icon}
            selected={kind === item.id}
            onChange={onKind}
          />
        ))}
      </FilterSheetSection>
      <FilterSheetSection title={t('filters.place')} chips={false}>
        <PlacePicker label="" value={placeId} allowCountry onChange={onChangePlace} />
      </FilterSheetSection>
    </FilterSheetFrame>
  );
});

import { memo, useCallback } from 'react';

import { FilterSheetFrame, FilterSheetSection } from '@/components/FilterSheetFrame';
import { SelectChip } from '@/components/FilterChips';
import { SERVICE_KIND_FILTERS } from '@/lib/services/kinds';
import type { ServiceKindId } from '@/lib/services/types';

export const ServicesFiltersSheet = memo(function ServicesFiltersSheet({
  open,
  kind,
  resultCount,
  onChangeKind,
  onClose,
  onReset,
}: {
  open: boolean;
  kind: ServiceKindId | 'all';
  resultCount: number;
  onChangeKind: (id: ServiceKindId | 'all') => void;
  onClose: () => void;
  onReset: () => void;
}) {
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
      dirty={kind !== 'all'}
      doneLabel={`Показать ${resultCount}`}
      onClose={onClose}
      onReset={onReset}>
      <FilterSheetSection title="Вид услуги">
        {SERVICE_KIND_FILTERS.map((item) => (
          <SelectChip
            key={item.id}
            id={item.id}
            label={item.label}
            icon={item.icon}
            selected={kind === item.id}
            onChange={onKind}
          />
        ))}
      </FilterSheetSection>
    </FilterSheetFrame>
  );
});

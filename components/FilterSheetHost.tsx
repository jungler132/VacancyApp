import { memo, useCallback, useMemo } from 'react';

import { FiltersSheet } from '@/components/FiltersSheet';
import { alertLabel, makeAlertKey } from '@/lib/alerts';
import { useFilterSheet } from '@/lib/hooks/useJobsFeed';
import { requestAlertPermission } from '@/lib/notifications';
import { applySearch } from '@/lib/store/filtersSlice';
import { removeSearch, saveSearch, toggleSearch } from '@/lib/store/alertsSlice';
import { useAppDispatch, useAppSelector } from '@/lib/store/hooks';
import { selectVisibleIds } from '@/lib/store/selectors';

export const FilterSheetHost = memo(function FilterSheetHost() {
  const dispatch = useAppDispatch();
  const sheet = useFilterSheet();
  const locale = useAppSelector((state) => state.appearance.locale);
  const visibleIds = useAppSelector(selectVisibleIds);
  const alerts = useAppSelector((state) => state.alerts.items);
  const snapshot = useMemo(
    () => ({
      query: sheet.query ?? '',
      region: sheet.region,
      categories: sheet.categories,
      extra: sheet.extra,
    }),
    [sheet.query, sheet.region, sheet.categories, sheet.extra],
  );
  const currentKey = makeAlertKey(snapshot);
  const watching = alerts.some((item) => item.enabled && makeAlertKey(item) === currentKey);
  const watches = useMemo(
    () => alerts.map((item) => ({ id: item.id, label: alertLabel(item, locale), enabled: item.enabled })),
    [alerts, locale],
  );

  const onToggleWatch = useCallback(() => {
    const match = alerts.find((item) => makeAlertKey(item) === currentKey);
    if (match?.enabled) {
      dispatch(removeSearch(match.id));
      return;
    }
    requestAlertPermission().catch(() => undefined);
    dispatch(saveSearch({ ...snapshot, lastSeenIds: visibleIds }));
  }, [alerts, currentKey, dispatch, snapshot, visibleIds]);

  const onOpenWatch = useCallback(
    (id: string) => {
      const alert = alerts.find((item) => item.id === id);
      if (alert) dispatch(applySearch(alert));
    },
    [alerts, dispatch],
  );

  return (
    <FiltersSheet
      open={sheet.open}
      region={sheet.region}
      categories={sheet.categories}
      extra={sheet.extra}
      watching={watching}
      watches={watches}
      onToggleWatch={onToggleWatch}
      onOpenWatch={onOpenWatch}
      onRemoveWatch={(id) => dispatch(removeSearch(id))}
      onToggleWatchEnabled={(id) => dispatch(toggleSearch(id))}
      onChangeRegion={sheet.setRegion}
      onToggleCategory={sheet.onToggleCategory}
      onChangeExtra={sheet.setExtra}
      onClose={sheet.onClose}
      onReset={sheet.onReset}
    />
  );
});

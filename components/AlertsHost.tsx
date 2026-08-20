import { useEffect } from 'react';
import { AppState } from 'react-native';

import { checkSavedSearches, makeAlertKey } from '@/lib/alerts';
import { syncAlertTask } from '@/lib/alertsTask';
import { listenNotificationTaps, setupNotificationHandler } from '@/lib/notifications';
import { replaceAlerts } from '@/lib/store/alertsSlice';
import { rememberJobs } from '@/lib/store/jobsSlice';
import { applySearch } from '@/lib/store/filtersSlice';
import { store } from '@/lib/store';
import { useAppDispatch, useAppSelector } from '@/lib/store/hooks';

let handledResponseId: string | undefined;
let checkGen = 0;

function applyAlertFromNotification(alertId: unknown, responseId?: string) {
  if (typeof alertId !== 'string') return;
  if (responseId && handledResponseId === responseId) return;
  if (responseId) handledResponseId = responseId;
  const alert = store.getState().alerts.items.find((item) => item.id === alertId);
  if (alert) store.dispatch(applySearch(alert));
}

export function AlertsHost() {
  const dispatch = useAppDispatch();
  const ready = useAppSelector((state) => state.alerts.ready);
  const watching = useAppSelector((state) => state.alerts.items.some((item) => item.enabled));

  useEffect(() => {
    setupNotificationHandler();
  }, []);

  useEffect(() => {
    if (ready) syncAlertTask(watching).catch(() => undefined);
  }, [ready, watching]);

  useEffect(() => {
    if (!ready) return;

    const run = () => {
      const gen = ++checkGen;
      const state = store.getState();
      checkSavedSearches({
        notify: true,
        skipKey: makeAlertKey(state.filters),
        alerts: state.alerts.items,
        persist: false,
      }).then(({ alerts, jobs, changed }) => {
        if (gen !== checkGen) return;
        if (jobs.length) dispatch(rememberJobs(jobs));
        if (changed) dispatch(replaceAlerts(alerts));
      });
    };

    run();
    const app = AppState.addEventListener('change', (next) => {
      if (next === 'active') run();
    });
    const stopTaps = listenNotificationTaps(applyAlertFromNotification);

    return () => {
      app.remove();
      stopTaps();
    };
  }, [ready, dispatch]);

  return null;
}

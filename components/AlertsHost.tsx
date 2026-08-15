import { useEffect } from 'react';
import { AppState } from 'react-native';
import * as Notifications from 'expo-notifications';

import { checkSavedSearches, makeAlertKey } from '@/lib/alerts';
import { syncAlertTask } from '@/lib/alertsTask';
import { setupNotificationHandler } from '@/lib/notifications';
import { replaceAlerts } from '@/lib/store/alertsSlice';
import { applySearch } from '@/lib/store/filtersSlice';
import { store } from '@/lib/store';
import { useAppDispatch, useAppSelector } from '@/lib/store/hooks';

let handledResponseId: string | undefined;

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

    const onActive = () => {
      const filters = store.getState().filters;
      checkSavedSearches({ notify: true, skipKey: makeAlertKey(filters) }).then((items) => {
        dispatch(replaceAlerts(items));
      });
    };

    const app = AppState.addEventListener('change', (next) => {
      if (next === 'active') onActive();
    });

    const tap = Notifications.addNotificationResponseReceivedListener((response) => {
      applyAlertFromNotification(
        response.notification.request.content.data?.alertId,
        response.notification.request.identifier,
      );
    });

    Notifications.getLastNotificationResponseAsync().then((response) => {
      if (!response) return;
      applyAlertFromNotification(
        response.notification.request.content.data?.alertId,
        response.notification.request.identifier,
      );
    });

    return () => {
      app.remove();
      tap.remove();
    };
  }, [ready, dispatch]);

  return null;
}

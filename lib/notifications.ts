import { Platform } from 'react-native';
import Constants from 'expo-constants';

import { t } from '@/lib/i18n';
import { DEFAULT_LOCALE, type AppLocale } from '@/lib/i18n/locale';

type NotificationsApi = typeof import('expo-notifications');

const CHANNEL = 'vakano-alerts';
let handlerReady = false;
let cached: NotificationsApi | null | undefined;

function notifications(): NotificationsApi | null {
  if (cached !== undefined) return cached;
  if (Platform.OS === 'web' || Constants.appOwnership === 'expo') {
    cached = null;
    return cached;
  }
  try {
    cached = require('expo-notifications') as NotificationsApi;
  } catch {
    cached = null;
  }
  return cached;
}

export function setupNotificationHandler() {
  const api = notifications();
  if (!api || handlerReady) return;
  handlerReady = true;
  api.setNotificationHandler({
    handleNotification: async () => ({
      shouldPlaySound: false,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

async function ensureChannel(locale: AppLocale = DEFAULT_LOCALE) {
  const api = notifications();
  if (!api || Platform.OS !== 'android') return;
  await api.setNotificationChannelAsync(CHANNEL, {
    name: t(locale, 'notify.channel'),
    importance: api.AndroidImportance.DEFAULT,
  });
}

export async function requestAlertPermission(): Promise<boolean> {
  try {
    const api = notifications();
    if (!api) return false;
    setupNotificationHandler();
    await ensureChannel();
    const current = await api.getPermissionsAsync();
    const next = current.status === 'granted' ? current : await api.requestPermissionsAsync();
    return next.status === 'granted';
  } catch {
    return false;
  }
}

export async function notifyNewJobs(
  count: number,
  label: string,
  alertId: string,
  locale: AppLocale = DEFAULT_LOCALE,
): Promise<void> {
  try {
    const api = notifications();
    if (!api || count <= 0) return;
    setupNotificationHandler();
    await ensureChannel(locale);
    const allowed = await api.getPermissionsAsync();
    if (allowed.status !== 'granted') return;
    await api.scheduleNotificationAsync({
      content: {
        title: t(locale, 'notify.title'),
        body: t(locale, 'notify.body', { count, label }),
        data: { type: 'alert', alertId },
        color: '#00236f',
      },
      trigger: null,
    });
  } catch {
    return;
  }
}

export function listenNotificationTaps(
  onTap: (alertId: unknown, responseId?: string) => void,
): () => void {
  const api = notifications();
  if (!api) return () => undefined;
  const tap = api.addNotificationResponseReceivedListener((response) => {
    onTap(response.notification.request.content.data?.alertId, response.notification.request.identifier);
  });
  api.getLastNotificationResponseAsync()
    .then((response) => {
      if (!response) return;
      onTap(response.notification.request.content.data?.alertId, response.notification.request.identifier);
    })
    .catch(() => undefined);
  return () => tap.remove();
}

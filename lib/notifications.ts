import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';

import { t } from '@/lib/i18n';
import { DEFAULT_LOCALE, type AppLocale } from '@/lib/i18n/locale';

const CHANNEL = 'workly-alerts';
let handlerReady = false;

export function setupNotificationHandler() {
  if (handlerReady || Platform.OS === 'web') return;
  handlerReady = true;
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldPlaySound: false,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

async function ensureChannel(locale: AppLocale = DEFAULT_LOCALE) {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync(CHANNEL, {
    name: t(locale, 'notify.channel'),
    importance: Notifications.AndroidImportance.DEFAULT,
  });
}

export async function requestAlertPermission(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  setupNotificationHandler();
  await ensureChannel();
  const current = await Notifications.getPermissionsAsync();
  const next =
    current.status === 'granted' ? current : await Notifications.requestPermissionsAsync();
  return next.status === 'granted';
}

export async function notifyNewJobs(
  count: number,
  label: string,
  alertId: string,
  locale: AppLocale = DEFAULT_LOCALE,
): Promise<void> {
  if (Platform.OS === 'web' || count <= 0) return;
  setupNotificationHandler();
  await ensureChannel(locale);
  const allowed = await Notifications.getPermissionsAsync();
  if (allowed.status !== 'granted') return;
  await Notifications.scheduleNotificationAsync({
    content: {
      title: t(locale, 'notify.title'),
      body: t(locale, 'notify.body', { count, label }),
      data: { type: 'alert', alertId },
      color: '#00236f',
    },
    trigger: null,
  });
}

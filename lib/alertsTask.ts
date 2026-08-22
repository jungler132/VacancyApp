import * as BackgroundTask from 'expo-background-task';
import * as TaskManager from 'expo-task-manager';
import { Platform } from 'react-native';

export const ALERT_TASK = 'vakano-alert-check';

if (Platform.OS !== 'web') {
  TaskManager.defineTask(ALERT_TASK, async () => {
    try {
      const { checkSavedSearches } = await import('@/lib/alerts');
      await checkSavedSearches({ notify: true, force: true });
      return BackgroundTask.BackgroundTaskResult.Success;
    } catch {
      return BackgroundTask.BackgroundTaskResult.Failed;
    }
  });
}

export async function syncAlertTask(enabled: boolean) {
  if (Platform.OS === 'web') return;
  try {
    const registered = await TaskManager.isTaskRegisteredAsync(ALERT_TASK);
    if (enabled && !registered) {
      await BackgroundTask.registerTaskAsync(ALERT_TASK, { minimumInterval: 60 });
      return;
    }
    if (!enabled && registered) {
      await BackgroundTask.unregisterTaskAsync(ALERT_TASK);
    }
  } catch {
    return;
  }
}

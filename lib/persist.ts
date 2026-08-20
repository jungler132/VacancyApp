import AsyncStorage from '@react-native-async-storage/async-storage';

const NEW_PREFIX = 'vakano:';
const LEGACY_PREFIX = 'workly:';

export async function readPersisted(key: string): Promise<string | null> {
  const raw = await AsyncStorage.getItem(key);
  if (raw != null) return raw;
  if (!key.startsWith(NEW_PREFIX)) return null;
  const legacy = await AsyncStorage.getItem(`${LEGACY_PREFIX}${key.slice(NEW_PREFIX.length)}`);
  if (legacy != null) {
    await AsyncStorage.setItem(key, legacy).catch(() => undefined);
  }
  return legacy;
}

export async function removePersisted(key: string): Promise<void> {
  await AsyncStorage.removeItem(key).catch(() => undefined);
  if (!key.startsWith(NEW_PREFIX)) return;
  await AsyncStorage.removeItem(`${LEGACY_PREFIX}${key.slice(NEW_PREFIX.length)}`).catch(() => undefined);
}

import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'workly:bound-email';

export async function readBoundEmail(): Promise<string | null> {
  const raw = await AsyncStorage.getItem(KEY);
  const email = raw?.trim().toLowerCase();
  return email || null;
}

export async function writeBoundEmail(email: string | null) {
  if (!email) {
    await AsyncStorage.removeItem(KEY).catch(() => undefined);
    return;
  }
  await AsyncStorage.setItem(KEY, email.trim().toLowerCase()).catch(() => undefined);
}

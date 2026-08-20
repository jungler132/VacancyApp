import { readPersisted, removePersisted } from '@/lib/persist';
import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'vakano:bound-email';

export async function readBoundEmail(): Promise<string | null> {
  const raw = await readPersisted(KEY);
  const email = raw?.trim().toLowerCase();
  return email || null;
}

export async function writeBoundEmail(email: string | null) {
  if (!email) {
    await removePersisted(KEY);
    return;
  }
  await AsyncStorage.setItem(KEY, email.trim().toLowerCase()).catch(() => undefined);
}

import AsyncStorage from '@react-native-async-storage/async-storage';

export const PREMIUM_STORAGE_KEY = 'workly:premium:v2';
const LEGACY_PREMIUM_KEYS = ['workly:premium'];

export function parsePremiumFlag(raw: unknown): boolean {
  return raw === true || raw === 1 || raw === '1' || raw === 'true';
}

export async function readPremium(): Promise<boolean> {
  await Promise.all(LEGACY_PREMIUM_KEYS.map((key) => AsyncStorage.removeItem(key).catch(() => undefined)));
  const raw = await AsyncStorage.getItem(PREMIUM_STORAGE_KEY);
  if (!raw) return false;
  try {
    return parsePremiumFlag(JSON.parse(raw));
  } catch {
    return parsePremiumFlag(raw);
  }
}

export async function writePremium(on: boolean): Promise<void> {
  await AsyncStorage.setItem(PREMIUM_STORAGE_KEY, JSON.stringify(on)).catch(() => undefined);
}

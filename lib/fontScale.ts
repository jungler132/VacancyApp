import { createContext, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type FontSizeId = 'sm' | 'md' | 'lg';

export const FONT_SIZE_KEY = 'workly:font-size:v1';
export const DEFAULT_FONT_SIZE: FontSizeId = 'md';

export const FONT_SIZE_OPTIONS: { id: FontSizeId; label: string }[] = [
  { id: 'sm', label: 'Маленький' },
  { id: 'md', label: 'Средний' },
  { id: 'lg', label: 'Большой' },
];

export const FONT_SCALE: Record<FontSizeId, number> = {
  sm: 0.88,
  md: 1,
  lg: 1.18,
};

export const FontScaleContext = createContext(FONT_SCALE[DEFAULT_FONT_SIZE]);

export function useFontScale() {
  return useContext(FontScaleContext);
}

export function parseFontSize(raw: unknown): FontSizeId {
  return raw === 'sm' || raw === 'md' || raw === 'lg' ? raw : DEFAULT_FONT_SIZE;
}

export async function readFontSize(): Promise<FontSizeId> {
  const raw = await AsyncStorage.getItem(FONT_SIZE_KEY);
  if (!raw) return DEFAULT_FONT_SIZE;
  try {
    return parseFontSize(JSON.parse(raw));
  } catch {
    return parseFontSize(raw);
  }
}

export async function writeFontSize(id: FontSizeId): Promise<void> {
  await AsyncStorage.setItem(FONT_SIZE_KEY, JSON.stringify(id)).catch(() => undefined);
}

export function scaleFont(size: number, scale: number): number {
  return Math.round(size * scale * 2) / 2;
}

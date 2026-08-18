export const APP_LOCALES = ['ru', 'en', 'az'] as const;
export type AppLocale = (typeof APP_LOCALES)[number];

export const DEFAULT_LOCALE: AppLocale = 'ru';

export function parseLocale(raw: unknown): AppLocale | null {
  return raw === 'ru' || raw === 'en' || raw === 'az' ? raw : null;
}

export function detectLocale(): AppLocale {
  try {
    const { getLocales } = require('expo-localization') as typeof import('expo-localization');
    const code = getLocales()[0]?.languageCode?.toLowerCase();
    if (code === 'az' || code === 'en' || code === 'ru') return code;
    if (code === 'uk' || code === 'be' || code === 'kk' || code === 'ky' || code === 'uz') return 'ru';
    return DEFAULT_LOCALE;
  } catch {
    return DEFAULT_LOCALE;
  }
}

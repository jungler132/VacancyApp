export const APP_LOCALES = ['ru', 'en', 'az'] as const;
export type AppLocale = (typeof APP_LOCALES)[number];

export const DEFAULT_LOCALE: AppLocale = 'ru';

/** Post-Soviet / CIS regions, without Azerbaijan (AZ → az). */
const CIS_REGIONS = new Set([
  'RU',
  'BY',
  'UA',
  'KZ',
  'KG',
  'UZ',
  'TJ',
  'TM',
  'MD',
  'AM',
  'GE',
]);

const CIS_LANGUAGES = new Set(['ru', 'uk', 'be', 'kk', 'ky', 'uz', 'tg', 'tk', 'hy', 'ka']);

export type DeviceLocaleHint = {
  languageCode?: string | null;
  languageRegionCode?: string | null;
  languageTag?: string | null;
  regionCode?: string | null;
};

export function parseLocale(raw: unknown): AppLocale | null {
  return raw === 'ru' || raw === 'en' || raw === 'az' ? raw : null;
}

function languageOf(hint: DeviceLocaleHint | null | undefined): string {
  const direct = hint?.languageCode?.trim().toLowerCase();
  if (direct) return direct;
  const tag = hint?.languageTag?.trim().toLowerCase() ?? '';
  return tag.split(/[-_]/)[0] || '';
}

function regionOf(hint: DeviceLocaleHint | null | undefined): string {
  const direct = (hint?.regionCode || hint?.languageRegionCode)?.trim();
  if (direct) return direct.toUpperCase();
  const tag = hint?.languageTag?.trim() ?? '';
  const match = /-([A-Za-z]{2})$/.exec(tag);
  return match?.[1]?.toUpperCase() ?? '';
}

/** AZ/TR → az, CIS except AZ → ru, everything else → en. */
export function localeFromDevice(hint?: DeviceLocaleHint | null): AppLocale {
  const language = languageOf(hint);
  const region = regionOf(hint);

  if (region === 'AZ' || region === 'TR' || language === 'az' || language === 'tr') return 'az';
  if (CIS_REGIONS.has(region) || CIS_LANGUAGES.has(language)) return 'ru';
  return 'en';
}

export function detectLocale(): AppLocale {
  try {
    const { getLocales } = require('expo-localization') as typeof import('expo-localization');
    return localeFromDevice(getLocales()[0] ?? null);
  } catch {
    return 'en';
  }
}

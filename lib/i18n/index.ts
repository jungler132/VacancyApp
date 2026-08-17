import { az } from './az';
import { en } from './en';
import { DEFAULT_LOCALE, type AppLocale } from './locale';
import { ru, type MsgId } from './ru';

export type { AppLocale, MsgId };
export { APP_LOCALES, DEFAULT_LOCALE, detectLocale, parseLocale } from './locale';

const TABLES: Record<AppLocale, Record<MsgId, string>> = { ru, en, az };

export type TVars = Record<string, string | number>;

export function keyOf(prefix: string, id: string | number): MsgId {
  return `${prefix}.${id}` as MsgId;
}

export function hasMsg(id: string): id is MsgId {
  return Object.prototype.hasOwnProperty.call(ru, id);
}

export function t(locale: AppLocale, id: MsgId, vars?: TVars): string {
  const table = TABLES[locale] ?? TABLES[DEFAULT_LOCALE];
  let out = table[id] ?? ru[id] ?? id;
  if (vars) {
    for (const [key, value] of Object.entries(vars)) {
      out = out.replaceAll(`{${key}}`, String(value));
    }
  }
  return out;
}

export function tokenLabel(locale: AppLocale, value: string, prefixes: string[] = ['fact', 'category']): string {
  for (const prefix of prefixes) {
    const id = `${prefix}.${value}`;
    if (hasMsg(id)) return t(locale, id);
  }
  return value;
}

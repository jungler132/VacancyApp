import { t } from './i18n';
import type { AppLocale } from './i18n/locale';

const DATE_LOCALE: Record<AppLocale, string> = { ru: 'ru-RU', en: 'en-GB', az: 'az-AZ' };

const ENTITIES: Record<string, string> = {
  amp: '&',
  apos: "'",
  quot: '"',
  lt: '<',
  gt: '>',
  nbsp: ' ',
  mdash: '—',
  ndash: '–',
  bull: '•',
  hellip: '…',
  rsquo: "'",
  lsquo: "'",
  rdquo: '"',
  ldquo: '"',
};

function decodeEntities(value: string): string {
  return value.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (full, ent: string) => {
    const token = ent.toLowerCase();
    if (token.startsWith('#x')) {
      const code = Number.parseInt(token.slice(2), 16);
      return Number.isFinite(code) ? String.fromCodePoint(code) : full;
    }
    if (token.startsWith('#')) {
      const code = Number(token.slice(1));
      return Number.isFinite(code) ? String.fromCodePoint(code) : full;
    }
    return ENTITIES[token] ?? full;
  });
}

/** Keeps headings, paragraphs and list markers. Use for vacancy bodies. */
export function htmlToText(value?: string | null): string {
  if (!value) return '';
  let html = value.replace(/\u00a0/g, ' ');
  if (/<[a-z][\s\S]*>/i.test(html)) {
    html = html.replace(/<script[\s\S]*?<\/script>/gi, ' ');
    html = html.replace(/<style[\s\S]*?<\/style>/gi, ' ');
    html = html.replace(/<\/h[1-6]>/gi, '\n\n');
    html = html.replace(/<h[1-6][^>]*>/gi, '\n\n');
    html = html.replace(/<\/(p|div|section|article|blockquote|tr)>/gi, '\n\n');
    html = html.replace(/<(br|hr)\s*\/?>/gi, '\n');
    html = html.replace(/<\/li>/gi, '\n');
    html = html.replace(/<li[^>]*>/gi, '• ');
    html = html.replace(/<\/?(ul|ol)[^>]*>/gi, '\n');
    html = html.replace(/<\/td>/gi, ' ');
    html = html.replace(/<[^>]+>/g, ' ');
  }
  html = decodeEntities(html);
  html = html.replace(/\r\n?/g, '\n');
  html = html.replace(/[^\S\n]+/g, ' ');
  html = html.replace(/ *\n */g, '\n');
  html = html.replace(/\n{3,}/g, '\n\n');
  return html.trim();
}

export function stripHtml(value?: string | null): string {
  return htmlToText(value).replace(/\s+/g, ' ').trim();
}

export function excerptOf(text: string, max = 180): string {
  const clean = stripHtml(text);
  if (clean.length <= max) return clean;
  return `${clean.slice(0, max).trim()}…`;
}

const CURRENCY_ALIASES: Record<string, string> = {
  RUR: 'RUB',
  RUB: 'RUB',
  РУБ: 'RUB',
  РУБЛЬ: 'RUB',
  РУБЛЕЙ: 'RUB',
  KZT: 'KZT',
  ТГ: 'KZT',
  ТЕНГЕ: 'KZT',
  TENGE: 'KZT',
  AZN: 'AZN',
  МАН: 'AZN',
  МАНАТ: 'AZN',
  MANAT: 'AZN',
  UAH: 'UAH',
  ГРН: 'UAH',
  ГРИВНА: 'UAH',
  UZS: 'UZS',
  СУМ: 'UZS',
  BYN: 'BYN',
  BYR: 'BYN',
  KGS: 'KGS',
  СОМ: 'KGS',
  GEL: 'GEL',
  TJS: 'TJS',
  AMD: 'AMD',
  MDL: 'MDL',
  USD: 'USD',
  EUR: 'EUR',
  GBP: 'GBP',
  PLN: 'PLN',
  CZK: 'CZK',
  HUF: 'HUF',
  TRY: 'TRY',
  CNY: 'CNY',
  JPY: 'JPY',
  INR: 'INR',
  CHF: 'CHF',
  CAD: 'CAD',
  AUD: 'AUD',
  SGD: 'SGD',
  SEK: 'SEK',
  NOK: 'NOK',
  DKK: 'DKK',
};

const CURRENCY_LABEL: Record<string, string> = {
  RUB: '₽',
  KZT: '₸',
  AZN: '₼',
  UAH: '₴',
  UZS: 'сум',
  BYN: 'Br',
  KGS: 'сом',
  GEL: '₾',
  TJS: 'сомони',
  AMD: '֏',
  MDL: 'L',
  USD: '$',
  EUR: '€',
  GBP: '£',
  PLN: 'zł',
  CZK: 'Kč',
  HUF: 'Ft',
  TRY: '₺',
  CNY: '¥',
  JPY: '¥',
  INR: '₹',
  CHF: 'Fr',
  CAD: 'C$',
  AUD: 'A$',
  SGD: 'S$',
  SEK: 'kr',
  NOK: 'kr',
  DKK: 'kr',
};

const HAS_CURRENCY =
  /[₽$€£¥₸₴₼₹₺]|RUB|RUR|KZT|USD|EUR|GBP|AZN|UAH|UZS|BYN|KGS|GEL|PLN|CZK|CHF|CAD|AUD|SGD|INR|TRY|руб|тенге|сум|манат|грн|сом|zł|Br\b/i;

export function currencyLabel(currency?: string | null): string {
  const code = normalizeCurrency(currency);
  if (!code) return '';
  return CURRENCY_LABEL[code] ?? code;
}

export const SALARY_CURRENCIES: { id: string; label: string }[] = [
  { id: 'RUB', label: '₽' },
  { id: 'AZN', label: '₼' },
  { id: 'KZT', label: '₸' },
  { id: 'USD', label: '$' },
  { id: 'EUR', label: '€' },
  { id: 'GBP', label: '£' },
  { id: 'UAH', label: '₴' },
];

export function composeSalary(raw?: string | null, currency?: string | null): string | undefined {
  const text = String(raw ?? '').replace(/\s+/g, ' ').trim();
  if (!text) return undefined;
  const amount = salaryAmount(text);
  if (amount != null) return formatSalary(amount, null, currency) ?? annotateSalary(text, currency);
  return annotateSalary(text, currency);
}

export function formatSalary(
  from?: number | null,
  to?: number | null,
  currency?: string | null,
): string | undefined {
  if (!from && !to) return undefined;
  const a = from ? formatAmount(from) : '';
  const b = to ? formatAmount(to) : '';
  const range = a && b && a !== b ? `${a} – ${b}` : a || b;
  const label = currencyLabel(currency);
  return label ? `${range} ${label}` : range;
}

export function annotateSalary(raw?: string | null, currency?: string | null): string | undefined {
  const text = String(raw ?? '').replace(/\s+/g, ' ').trim();
  if (!text) return undefined;
  if (!/\d/.test(text) || HAS_CURRENCY.test(text)) return text;
  const label = currencyLabel(currency);
  return label ? `${text} ${label}` : text;
}

function normalizeCurrency(currency?: string | null): string {
  const raw = (currency || '')
    .replace(/[«».]/g, '')
    .replace(/\s+/g, '')
    .trim()
    .toUpperCase();
  if (!raw) return '';
  return CURRENCY_ALIASES[raw] ?? (/^[A-Z]{3}$/.test(raw) ? raw : '');
}

function formatAmount(value: number): string {
  return Math.round(value)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}

export function toPublishedAt(value?: string | number | null): string | undefined {
  if (value == null || value === '') return undefined;
  let ms: number | null = null;
  if (typeof value === 'number' && Number.isFinite(value)) {
    ms = value > 0 && value < 1e12 ? value * 1000 : value;
  } else {
    const raw = String(value).trim();
    if (/^\d+(\.\d+)?$/.test(raw)) {
      const n = Number(raw);
      ms = n > 0 && n < 1e12 ? n * 1000 : n;
    } else {
      const parsed = Date.parse(raw);
      if (!Number.isNaN(parsed)) ms = parsed;
    }
  }
  if (ms == null || !Number.isFinite(ms)) return undefined;
  const date = new Date(ms);
  if (Number.isNaN(date.getTime())) return undefined;
  const year = date.getFullYear();
  if (year < 2000 || year > 2100) return undefined;
  return date.toISOString();
}

export function formatDate(iso?: string, locale: AppLocale = 'ru'): string {
  const normalized = toPublishedAt(iso) ?? iso;
  if (!normalized) return '';
  const time = Date.parse(normalized);
  if (Number.isNaN(time)) return '';
  const year = new Date(time).getFullYear();
  if (year < 2000 || year > 2100) return '';
  const diff = Date.now() - time;
  const stamp = () => new Date(time).toLocaleDateString(DATE_LOCALE[locale]);
  if (diff < 0) return stamp();
  const min = Math.floor(diff / 60000);
  if (min < 60) return t(locale, 'date.min', { count: Math.max(1, min) });
  const hours = Math.floor(min / 60);
  if (hours < 24) return t(locale, 'date.hour', { count: hours });
  const days = Math.floor(hours / 24);
  if (days < 7) return t(locale, 'date.day', { count: days });
  return stamp();
}

export function displayName(value: string): string {
  const text = value.trim().replace(/\s+/g, ' ');
  if (!text) return text;
  const letters = text.replace(/[^a-zA-Zа-яА-ЯёЁ]/g, '');
  if (!letters) return text;
  const upper = letters.replace(/[^A-ZА-ЯЁ]/g, '').length;
  if (upper / letters.length < 0.55) return text;
  return text
    .toLocaleLowerCase('ru-RU')
    .replace(/(^|[\s«"'(])([a-zа-яё])/g, (_, prefix: string, char: string) => prefix + char.toLocaleUpperCase('ru-RU'));
}

export function cleanExcerpt(title: string, company: string, excerpt?: string): string {
  let text = stripHtml(excerpt ?? '');
  if (!text) return '';
  const cut = (chunk: string) => {
    if (!chunk) return;
    const escaped = chunk.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    text = text.replace(new RegExp(`^${escaped}[\\s—–:,.\\-]*`, 'i'), '').trim();
  };
  cut(title);
  cut(company);
  cut('Remote');
  cut('Удалённо');
  if (text.length < 28) return '';
  return excerptOf(text, 140);
}

export function splitParagraphs(text: string): string[] {
  const clean = stripHtml(text);
  if (!clean) return [];
  const byBreak = clean
    .split(/\n{2,}/)
    .map((part) => part.trim())
    .filter(Boolean);
  if (byBreak.length > 1) return byBreak;

  const sentences: string[] = [];
  let rest = clean;
  while (rest.length) {
    const match = rest.match(/^[\s\S]{12,}?[.!?](?:\s+|$)/);
    if (!match) {
      if (rest.trim()) sentences.push(rest.trim());
      break;
    }
    sentences.push(match[0].trim());
    rest = rest.slice(match[0].length);
  }
  if (sentences.length < 3) return [clean];
  const chunks: string[] = [];
  let buffer = '';
  for (const sentence of sentences) {
    buffer = buffer ? `${buffer} ${sentence}` : sentence;
    if (buffer.length > 220) {
      chunks.push(buffer);
      buffer = '';
    }
  }
  if (buffer) chunks.push(buffer);
  return chunks.length ? chunks : [clean];
}

export function formatPlace(location?: string, remote?: boolean): string {
  const raw = (location ?? '').trim();
  if (!raw || /^(remote|worldwide|anywhere|удал)/i.test(raw)) {
    return remote ? '' : raw;
  }
  return displayName(raw);
}

export function formatEmployment(value?: string): string {
  if (!value) return '';
  const v = value.toLowerCase();
  if (/full[\s-]?time|полная|tam ştat/.test(v)) return 'full';
  if (/part[\s-]?time|частич|неполн|yarımştat/.test(v)) return 'part';
  if (/contract|контракт/.test(v)) return 'contract';
  if (/intern|стаж/.test(v)) return 'intern';
  if (/temporary|врем/.test(v)) return 'temp';
  return value;
}

export function formatSchedule(value?: string): string {
  if (!value) return '';
  const v = value.toLowerCase();
  if (/удал|remote|distant|telework/.test(v)) return 'remote';
  if (/гибрид|hybrid/.test(v)) return 'hybrid';
  if (/гибк|flex/.test(v)) return 'flex';
  if (/вахт|rotat/.test(v)) return 'rotation';
  if (/смен|shift/.test(v)) return 'shift';
  if (/полн(ый)? день|full[\s-]?day/.test(v)) return 'fullday';
  return value;
}

export function formatExperience(value?: string): string {
  if (!value) return '';
  const v = value.toLowerCase();
  if (/нет опыта|no experience|без опыта/.test(v)) return 'none';
  if (/более 6|6\+|over 6/.test(v)) return 'y6';
  if (/3.?6|от 3|3 to 6/.test(v)) return 'y3';
  if (/1.?3|от 1|1 to 3|1 год/.test(v)) return 'y1';
  return value;
}

function inferExperience(job: {
  title?: string;
  excerpt?: string;
  description?: string;
  experience?: string;
}): string {
  const fromApi = formatExperience(job.experience);
  if (fromApi) return fromApi;
  const hay = `${job.title ?? ''} ${job.excerpt ?? ''}`.toLowerCase();
  if (/intern|стажёр|стажер/.test(hay)) return 'intern';
  if (/без опыта|no experience|junior|джун/.test(hay)) return 'junior';
  if (/\bmiddle\b|мидл/.test(hay)) return 'middle';
  if (/\bsenior\b|сеньор|тимлид|\blead\b/.test(hay)) return 'senior';
  return '';
}

function inferFormat(job: { remote?: boolean; location?: string; schedule?: string; title?: string; excerpt?: string }): string {
  const hay = `${job.schedule ?? ''} ${job.title ?? ''} ${job.location ?? ''} ${job.excerpt ?? ''}`.toLowerCase();
  if (/гибрид|hybrid/.test(hay)) return 'hybrid';
  if (job.remote || /удал|remote|worldwide|anywhere/.test(hay)) return 'remote';
  if ((job.location ?? '').trim()) return 'office';
  return '';
}

function inferLangs(job: { title?: string; excerpt?: string; description?: string }): string {
  const text = `${job.title ?? ''} ${job.excerpt ?? ''} ${job.description ?? ''}`.slice(0, 800);
  const letters = text.replace(/[^a-zA-Zа-яА-ЯёЁəğıöüşçƏĞİÖÜŞÇ]/g, '');
  if (letters.length < 8) return '';
  const cyr = (letters.match(/[а-яА-ЯёЁ]/g) ?? []).length;
  const az = (letters.match(/[əğıöüşçƏĞİÖÜŞÇ]/g) ?? []).length;
  if (az >= 3) return 'AZ';
  if (cyr / letters.length > 0.35) return 'RU';
  return 'EN';
}

export function jobFacts(job: {
  sourceName?: string;
  title?: string;
  location?: string;
  remote?: boolean;
  employment?: string;
  experience?: string;
  schedule?: string;
  category?: string;
  excerpt?: string;
  description?: string;
}): { id: 'source' | 'format' | 'employment' | 'schedule' | 'experience' | 'category' | 'langs'; value: string }[] {
  const format = inferFormat(job);
  const employment = formatEmployment(job.employment);
  const schedule = formatSchedule(job.schedule);
  const experience = inferExperience(job);
  const langs = inferLangs(job);
  const category = (job.category ?? '').trim();
  const rows: { id: 'source' | 'format' | 'employment' | 'schedule' | 'experience' | 'category' | 'langs'; value: string }[] = [];
  if (job.sourceName) rows.push({ id: 'source', value: job.sourceName });
  if (format) rows.push({ id: 'format', value: format });
  if (employment) rows.push({ id: 'employment', value: employment });
  if (schedule && schedule !== format && schedule !== 'remote') {
    rows.push({ id: 'schedule', value: schedule });
  }
  if (experience) rows.push({ id: 'experience', value: experience });
  if (category && category.length < 42) rows.push({ id: 'category', value: category });
  if (langs) rows.push({ id: 'langs', value: langs });
  return rows;
}

export function joinMeta(parts: Array<string | undefined | null | false>): string {
  return parts
    .map((part) => (typeof part === 'string' ? part.trim() : ''))
    .filter(Boolean)
    .join(' · ');
}

export function salaryAmount(salary?: string): number | null {
  if (!salary) return null;
  const matches = salary.match(/\d[\d\s.,]*/g);
  if (!matches) return null;
  const values = matches
    .map((chunk) => Number(chunk.replace(/[\s,]/g, '').replace(/\.(?=\d{3}\b)/, '')))
    .filter((value) => Number.isFinite(value) && value > 10);
  if (!values.length) return null;
  return Math.max(...values);
}

export function jobTags(job: {
  remote?: boolean;
  employment?: string;
  experience?: string;
  schedule?: string;
  title?: string;
  excerpt?: string;
}): string[] {
  const tags: string[] = [];
  const format = inferFormat(job);
  if (format && format !== 'office') tags.push(format);
  const schedule = formatSchedule(job.schedule);
  if (schedule && schedule !== 'remote' && schedule !== format && !tags.includes(schedule)) tags.push(schedule);
  const employment = formatEmployment(job.employment);
  if (employment && employment !== 'full') tags.push(employment);
  const experience = inferExperience(job);
  if (experience && !tags.includes(experience)) tags.push(experience);
  return tags.slice(0, 3);
}

export function jobKey(title: string, company: string): string {
  return `${title}|${company}`
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

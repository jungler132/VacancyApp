const UA = 'WorklyJobs/1.0 (workly.app.contact@gmail.com)';

function combineSignals(timeoutSignal: AbortSignal, external?: AbortSignal): AbortSignal {
  if (!external) return timeoutSignal;
  if (typeof AbortSignal !== 'undefined' && typeof AbortSignal.any === 'function') {
    return AbortSignal.any([timeoutSignal, external]);
  }
  const merged = new AbortController();
  const abort = () => merged.abort();
  if (external.aborted || timeoutSignal.aborted) {
    abort();
    return merged.signal;
  }
  external.addEventListener('abort', abort, { once: true });
  timeoutSignal.addEventListener('abort', abort, { once: true });
  return merged.signal;
}

export async function fetchJson<T>(
  url: string,
  init: RequestInit & { timeoutMs?: number } = {},
): Promise<T> {
  const { timeoutMs = 12000, headers, signal: externalSignal, ...rest } = init;
  const timeoutController = new AbortController();
  let timedOut = false;
  const timer = setTimeout(() => {
    timedOut = true;
    timeoutController.abort();
  }, timeoutMs);

  try {
    if (externalSignal?.aborted) {
      throw Object.assign(new Error('aborted'), { name: 'AbortError' });
    }
    const res = await fetch(url, {
      ...rest,
      signal: combineSignals(timeoutController.signal, externalSignal ?? undefined),
      headers: {
        Accept: 'application/json',
        'User-Agent': UA,
        ...headers,
      },
    });
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }
    return (await res.json()) as T;
  } catch (error) {
    if (timedOut) throw new Error('timeout');
    if (externalSignal?.aborted) {
      throw Object.assign(new Error('aborted'), { name: 'AbortError' });
    }
    throw error;
  } finally {
    clearTimeout(timer);
  }
}

export function stripHtml(value?: string | null): string {
  if (!value) return '';
  return value
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/\s+/g, ' ')
    .trim();
}

export function excerptOf(text: string, max = 180): string {
  const clean = stripHtml(text);
  if (clean.length <= max) return clean;
  return `${clean.slice(0, max).trim()}…`;
}

export function formatSalary(
  from?: number | null,
  to?: number | null,
  currency?: string | null,
): string | undefined {
  if (!from && !to) return undefined;
  const cur = normalizeCurrency(currency);
  const a = from ? formatMoney(from, cur) : '';
  const b = to ? formatMoney(to, cur) : '';
  if (a && b && a !== b) return `${a} – ${b}`;
  return a || b;
}

function normalizeCurrency(currency?: string | null): string {
  const raw = (currency || '').replace(/[«»]/g, '').trim().toUpperCase();
  if (raw === 'RUR' || raw === 'RUB' || raw === 'РУБ') return 'RUB';
  if (!raw) return '';
  return raw;
}

function formatMoney(value: number, currency: string): string {
  try {
    return new Intl.NumberFormat('ru-RU', {
      style: currency ? 'currency' : 'decimal',
      currency: currency || undefined,
      maximumFractionDigits: 0,
    }).format(value);
  } catch {
    return `${value.toLocaleString('ru-RU')} ${currency}`.trim();
  }
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

export function formatDate(iso?: string): string {
  const normalized = toPublishedAt(iso) ?? iso;
  if (!normalized) return '';
  const time = Date.parse(normalized);
  if (Number.isNaN(time)) return '';
  const year = new Date(time).getFullYear();
  if (year < 2000 || year > 2100) return '';
  const diff = Date.now() - time;
  if (diff < 0) return new Date(time).toLocaleDateString('ru-RU');
  const min = Math.floor(diff / 60000);
  if (min < 60) return `${Math.max(1, min)} мин`;
  const hours = Math.floor(min / 60);
  if (hours < 24) return `${hours} ч`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} дн`;
  return new Date(time).toLocaleDateString('ru-RU');
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
  if (byBreak.length > 1) return byBreak.slice(0, 12);

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
  return chunks.slice(0, 12);
}

export function formatPlace(location?: string, remote?: boolean): string {
  const raw = (location ?? '').trim();
  if (!raw || /^(remote|worldwide|anywhere|удал)/i.test(raw)) {
    return remote ? 'Удалённо' : raw;
  }
  return displayName(raw);
}

export function formatEmployment(value?: string): string {
  if (!value) return '';
  const v = value.toLowerCase();
  if (/full[\s-]?time|полная/.test(v)) return 'Полная занятость';
  if (/part[\s-]?time|частич/.test(v)) return 'Частичная';
  if (/contract|контракт/.test(v)) return 'Контракт';
  if (/intern|стаж/.test(v)) return 'Стажировка';
  return value;
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

export function jobTags(job: { remote?: boolean; employment?: string; title?: string; excerpt?: string }): string[] {
  const tags: string[] = [];
  const hay = `${job.employment ?? ''} ${job.title ?? ''} ${job.excerpt ?? ''}`.toLowerCase();
  if (job.remote || /удал|remote/.test(hay)) tags.push('Удалёнка');
  if (/вахт|shift|rotat/.test(hay)) tags.push('Вахта');
  const employment = formatEmployment(job.employment);
  if (employment && employment !== 'Полная занятость') tags.push(employment);
  else if (/без опыта|no experience|junior/.test(hay)) tags.push('Без опыта');
  return tags.slice(0, 3);
}

export function jobKey(title: string, company: string): string {
  return `${title}|${company}`
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

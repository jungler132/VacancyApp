import type { AppLocale } from '@/lib/i18n';
import { SUPPORT_EMAIL } from '@/lib/support';

const MAX_QUERY_BYTES = 450;
const MAX_CHUNKS = 80;
const CONCURRENCY = 2;
const CONTACT_EMAIL = SUPPORT_EMAIL;

export function detectTextLocale(text: string): AppLocale {
  if (/[əƏğĞıİöÖşŞçÇüÜ]/.test(text)) return 'az';
  if (/[А-Яа-яЁёІіЇїЄєҒғҚқҮүҰұҢңҺһ]/.test(text)) return 'ru';
  return 'en';
}

export function isUsableTranslation(text: string): boolean {
  const out = text.trim();
  if (!out) return false;
  if (/^MYMEMORY WARNING/i.test(out)) return false;
  if (/INVALID LANGUAGE PAIR/i.test(out)) return false;
  if (/QUERY LENGTH LIMIT/i.test(out)) return false;
  return true;
}

export function needsTranslation(text: string, to: AppLocale): boolean {
  const value = text.trim();
  if (value.length < 16) return false;
  if (/^#[\w.-]+$/.test(value)) return false;
  if (/^https?:\/\//i.test(value)) return false;
  if (/^[\d\s.,$€£₽₼₸%–—-]+$/.test(value)) return false;
  return detectTextLocale(value) !== to;
}

export function leftoverSourcePieces(text: string, to: AppLocale): string[] {
  const pieces: string[] = [];
  for (const line of text.split(/\n+/)) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    const parts = trimmed
      .split(/(?<=[.!?])\s+/)
      .flatMap((part) => part.split(/(?<=[\p{Ll}\p{N}])\s+(?=[A-Z][a-z]{2,})/u))
      .map((part) => part.trim())
      .filter(Boolean);

    let buffer = '';
    const flush = () => {
      if (buffer.length >= 16 && detectTextLocale(buffer) !== to && !/^#[\w.-]+$/.test(buffer)) {
        pieces.push(buffer);
      }
      buffer = '';
    };
    for (const part of parts) {
      if (detectTextLocale(part) !== to && part.length >= 12 && !/^#[\w.-]+$/.test(part)) {
        buffer = buffer ? `${buffer} ${part}` : part;
      } else {
        flush();
      }
    }
    flush();
  }
  return pieces;
}

function utf8Len(text: string): number {
  return new TextEncoder().encode(text).length;
}

function cutToBytes(text: string, maxBytes: number): number {
  if (utf8Len(text) <= maxBytes) return text.length;
  let lo = 0;
  let hi = text.length;
  while (lo < hi) {
    const mid = Math.ceil((lo + hi) / 2);
    if (utf8Len(text.slice(0, mid)) <= maxBytes) lo = mid;
    else hi = mid - 1;
  }
  const space = text.lastIndexOf(' ', lo);
  return space > lo * 0.45 ? space : Math.max(1, lo);
}

function splitLong(text: string, maxBytes: number): string[] {
  const parts: string[] = [];
  let rest = text.trim();
  while (utf8Len(rest) > maxBytes) {
    const cut = cutToBytes(rest, maxBytes);
    parts.push(rest.slice(0, cut).trim());
    rest = rest.slice(cut).trim();
  }
  if (rest) parts.push(rest);
  return parts;
}

/** Splits vacancy text so each piece fits MyMemory's ~500-byte query. Does not drop the tail. */
export function splitTranslateChunks(text: string, maxBytes = MAX_QUERY_BYTES): string[] {
  const lines = text.replace(/\r\n/g, '\n').split('\n');
  const units: string[] = [];
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    if (utf8Len(trimmed) <= maxBytes) units.push(trimmed);
    else units.push(...splitLong(trimmed, maxBytes));
  }

  const parts: string[] = [];
  let buf = '';
  for (const unit of units) {
    const next = buf ? `${buf}\n${unit}` : unit;
    if (utf8Len(next) <= maxBytes) {
      buf = next;
      continue;
    }
    if (buf) parts.push(buf);
    buf = unit;
  }
  if (buf) parts.push(buf);
  return parts;
}

function throwIfAborted(signal?: AbortSignal) {
  if (signal?.aborted) {
    const err = new Error('Aborted');
    err.name = 'AbortError';
    throw err;
  }
}

async function mapPool<T, R>(
  items: T[],
  limit: number,
  fn: (item: T) => Promise<R>,
  signal?: AbortSignal,
): Promise<R[]> {
  const out = new Array<R>(items.length);
  let index = 0;
  const worker = async () => {
    while (index < items.length) {
      throwIfAborted(signal);
      const i = index;
      index += 1;
      out[i] = await fn(items[i]);
    }
  };
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, () => worker()));
  return out;
}

function delay(ms: number, signal?: AbortSignal): Promise<void> {
  throwIfAborted(signal);
  return new Promise((resolve, reject) => {
    const timer = setTimeout(resolve, ms);
    const onAbort = () => {
      clearTimeout(timer);
      const err = new Error('Aborted');
      err.name = 'AbortError';
      reject(err);
    };
    signal?.addEventListener('abort', onAbort, { once: true });
  });
}

async function translateChunk(text: string, from: AppLocale, to: AppLocale, signal?: AbortSignal): Promise<string> {
  throwIfAborted(signal);
  const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${from}|${to}&de=${encodeURIComponent(CONTACT_EMAIL)}`;
  const response = await fetch(url, { signal });
  if (!response.ok) throw new Error('translate-http');
  const json = (await response.json()) as { responseStatus?: number; responseData?: { translatedText?: string } };
  const out = json.responseData?.translatedText?.trim() ?? '';
  if (!isUsableTranslation(out) || (json.responseStatus && json.responseStatus !== 200)) {
    throw new Error('translate-empty');
  }
  return out.replace(/&quot;/g, '"').replace(/&#39;/g, "'");
}

async function translateChunkRetry(
  text: string,
  from: AppLocale,
  to: AppLocale,
  signal?: AbortSignal,
): Promise<{ ok: boolean; text: string }> {
  let last = text;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      if (attempt) await delay(280 * attempt, signal);
      const out = await translateChunk(text, from, to, signal);
      last = out;
      if (!needsTranslation(out, to)) return { ok: true, text: out };
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') throw error;
    }
  }
  return { ok: last !== text && !needsTranslation(last, to), text: last };
}

export async function translateText(text: string, to: AppLocale, signal?: AbortSignal): Promise<string> {
  const source = text.trim();
  if (!source) return '';
  const from = detectTextLocale(source);
  if (from === to) return source;
  const chunks = splitTranslateChunks(source);
  if (!chunks.length) return '';

  const head = chunks.slice(0, MAX_CHUNKS);
  const leftover = chunks.slice(MAX_CHUNKS);
  const results = await mapPool(head, CONCURRENCY, (chunk) => translateChunkRetry(chunk, from, to, signal), signal);

  if (!results.some((item) => item.ok)) throw new Error('translate-empty');
  let body = [...results.map((item) => item.text), ...leftover].join('\n');

  const pending = leftoverSourcePieces(body, to);
  for (const piece of pending) {
    const next = await translateChunkRetry(piece, from, to, signal);
    if (next.ok && next.text !== piece) body = body.replace(piece, next.text);
  }
  return body;
}

export type JobTextBundle = { title: string; company: string; body: string };

export async function translateJobTexts(
  bundle: JobTextBundle,
  to: AppLocale,
  signal?: AbortSignal,
): Promise<JobTextBundle> {
  const title = await translateText(bundle.title, to, signal);
  const company = await translateText(bundle.company, to, signal);
  const body = await translateText(bundle.body, to, signal);
  return { title, company, body };
}

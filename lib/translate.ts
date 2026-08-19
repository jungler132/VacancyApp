import type { AppLocale } from '@/lib/i18n';
import { SUPPORT_EMAIL } from '@/lib/support';

const MAX_QUERY_BYTES = 450;
const MAX_CHUNKS = 48;
const MAX_LEFTOVER = 20;
const CONCURRENCY = 3;
const CONTACT_EMAIL = SUPPORT_EMAIL;
const FETCH_TIMEOUT_MS = 8000;

export type TranslateFailCode = 'network' | 'quota' | 'unavailable';

export class TranslateError extends Error {
  readonly code: TranslateFailCode;

  constructor(code: TranslateFailCode) {
    super(code);
    this.name = 'TranslateError';
    this.code = code;
  }
}

export function isNetworkError(error: unknown): boolean {
  if (error instanceof TranslateError) return error.code === 'network';
  if (!(error instanceof Error)) return false;
  const message = error.message.toLowerCase();
  if (message === 'timeout' || message.includes('timed out')) return true;
  if (message.includes('network request failed')) return true;
  if (message.includes('failed to fetch')) return true;
  if (message.includes('the internet connection appears to be offline')) return true;
  if (message.includes('could not connect')) return true;
  if (message.includes('network connection was lost')) return true;
  if (error.name === 'TypeError' && /network|fetch|internet|connect/i.test(error.message)) return true;
  return false;
}

export function translateFailCode(error: unknown): TranslateFailCode {
  if (error instanceof TranslateError) return error.code;
  if (isNetworkError(error)) return 'network';
  return 'unavailable';
}

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

export function targetScriptRatio(text: string, to: AppLocale): number {
  const letters = [...text].filter((ch) => /\p{L}/u.test(ch));
  if (!letters.length) return 1;
  if (to === 'ru') {
    return letters.filter((ch) => /[А-Яа-яЁёІіЇїЄє]/.test(ch)).length / letters.length;
  }
  if (to === 'en') {
    return letters.filter((ch) => /[A-Za-z]/.test(ch)).length / letters.length;
  }
  return /[əƏğĞıİöÖşŞçÇüÜ]/.test(text) ? 1 : 0;
}

export function isSuccessfulTranslation(source: string, out: string, to: AppLocale): boolean {
  if (!isUsableTranslation(out)) return false;
  if (to === 'az') return out.trim() !== source.trim();
  return targetScriptRatio(out, to) >= 0.45;
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

type MyMemoryResponse = {
  responseStatus?: number | string;
  responseData?: { translatedText?: string };
  quotaFinished?: boolean;
};

function decodeEntities(text: string): string {
  return text.replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&');
}

async function translateFetchJson<T>(url: string, signal?: AbortSignal): Promise<T> {
  throwIfAborted(signal);
  const timeoutController = new AbortController();
  let timedOut = false;
  const timer = setTimeout(() => {
    timedOut = true;
    timeoutController.abort();
  }, FETCH_TIMEOUT_MS);
  const merged = new AbortController();
  const abort = () => merged.abort();
  if (signal?.aborted || timeoutController.signal.aborted) abort();
  else {
    signal?.addEventListener('abort', abort, { once: true });
    timeoutController.signal.addEventListener('abort', abort, { once: true });
  }
  try {
    const response = await fetch(url, {
      signal: merged.signal,
      headers: { Accept: 'application/json' },
    });
    if (response.status === 429) throw new TranslateError('quota');
    if (!response.ok) throw new TranslateError('unavailable');
    return (await response.json()) as T;
  } catch (error) {
    if (error instanceof TranslateError) throw error;
    if (timedOut) throw new TranslateError('network');
    if (signal?.aborted) {
      const err = new Error('Aborted');
      err.name = 'AbortError';
      throw err;
    }
    if (error instanceof Error && error.name === 'AbortError') {
      throw timedOut ? new TranslateError('network') : error;
    }
    if (isNetworkError(error)) throw new TranslateError('network');
    throw new TranslateError('unavailable');
  } finally {
    clearTimeout(timer);
  }
}

async function translateMyMemory(text: string, from: AppLocale, to: AppLocale, signal?: AbortSignal): Promise<string> {
  const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${from}|${to}&de=${encodeURIComponent(CONTACT_EMAIL)}`;
  const json = await translateFetchJson<MyMemoryResponse>(url, signal);
  const out = decodeEntities(json.responseData?.translatedText?.trim() ?? '');
  if (json.quotaFinished || /^MYMEMORY WARNING/i.test(out)) throw new TranslateError('quota');
  const status = Number(json.responseStatus);
  if (!isUsableTranslation(out) || (Number.isFinite(status) && status !== 0 && status !== 200)) {
    throw new TranslateError('unavailable');
  }
  return out;
}

async function translateGoogle(text: string, from: AppLocale, to: AppLocale, signal?: AbortSignal): Promise<string> {
  const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${to}&dt=t&q=${encodeURIComponent(text)}`;
  const json = await translateFetchJson<unknown>(url, signal);
  if (!Array.isArray(json) || !Array.isArray(json[0])) throw new TranslateError('unavailable');
  const out = json[0]
    .map((part) => (Array.isArray(part) && typeof part[0] === 'string' ? part[0] : ''))
    .join('')
    .trim();
  if (!isUsableTranslation(out)) throw new TranslateError('unavailable');
  return out;
}

async function translateChunk(text: string, from: AppLocale, to: AppLocale, signal?: AbortSignal): Promise<string> {
  throwIfAborted(signal);
  let lastError: unknown;
  for (const engine of [translateGoogle, translateMyMemory]) {
    try {
      const out = await engine(text, from, to, signal);
      if (isSuccessfulTranslation(text, out, to)) return out;
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') throw error;
      lastError = error;
    }
  }
  if (lastError instanceof TranslateError) throw lastError;
  throw new TranslateError('unavailable');
}

async function translateChunkRetry(
  text: string,
  from: AppLocale,
  to: AppLocale,
  signal?: AbortSignal,
): Promise<{ ok: boolean; text: string }> {
  try {
    const out = await translateChunk(text, from, to, signal);
    if (isSuccessfulTranslation(text, out, to)) return { ok: true, text: out };
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') throw error;
    if (error instanceof TranslateError) throw error;
    if (isNetworkError(error)) throw new TranslateError('network');
  }
  return { ok: false, text };
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

  if (!results.some((item) => item.ok)) throw new TranslateError('unavailable');
  let body = [...results.map((item) => item.text), ...leftover].join('\n');

  let leftoverTries = 0;
  while (leftoverTries < MAX_LEFTOVER) {
    const pending = leftoverSourcePieces(body, to)[0];
    if (!pending) break;
    const parts = splitTranslateChunks(pending);
    let progressed = false;
    for (const part of parts) {
      if (leftoverTries >= MAX_LEFTOVER) break;
      leftoverTries += 1;
      throwIfAborted(signal);
      try {
        const next = await translateChunkRetry(part, from, to, signal);
        if (next.ok && next.text !== part) {
          body = body.replace(part, next.text);
          progressed = true;
        }
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') throw error;
      }
    }
    if (!progressed) break;
  }

  if (needsTranslation(source, to) && !isSuccessfulTranslation(source, body, to)) {
    throw new TranslateError('unavailable');
  }
  return body;
}

export type JobTextBundle = { title: string; company: string; body: string };

export async function translateJobTexts(
  bundle: JobTextBundle,
  to: AppLocale,
  signal?: AbortSignal,
): Promise<JobTextBundle> {
  let lastError: unknown;
  const one = async (text: string) => {
    try {
      return await translateText(text, to, signal);
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') throw error;
      lastError = error;
      return text;
    }
  };
  const title = await one(bundle.title);
  const company = needsTranslation(bundle.company, to) ? await one(bundle.company) : bundle.company;
  const body = await one(bundle.body);
  if (needsTranslation(bundle.body, to) && !isSuccessfulTranslation(bundle.body, body, to)) {
    if (lastError instanceof TranslateError) throw lastError;
    throw new TranslateError('unavailable');
  }
  if (title === bundle.title && company === bundle.company && body === bundle.body) {
    if (lastError instanceof TranslateError) throw lastError;
    throw new TranslateError('unavailable');
  }
  return { title, company, body };
}

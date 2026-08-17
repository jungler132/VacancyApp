import type { AppLocale } from '@/lib/i18n';

const CHUNK = 420;
const MAX_CHUNKS = 5;

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

function splitChunks(text: string): string[] {
  const clean = text.trim();
  if (!clean) return [];
  const parts: string[] = [];
  let rest = clean;
  while (rest.length > CHUNK && parts.length < MAX_CHUNKS) {
    let cut = rest.lastIndexOf(' ', CHUNK);
    if (cut < CHUNK * 0.5) cut = CHUNK;
    parts.push(rest.slice(0, cut).trim());
    rest = rest.slice(cut).trim();
  }
  if (rest && parts.length < MAX_CHUNKS) parts.push(rest);
  return parts;
}

function throwIfAborted(signal?: AbortSignal) {
  if (signal?.aborted) {
    const err = new Error('Aborted');
    err.name = 'AbortError';
    throw err;
  }
}

async function translateChunk(text: string, from: AppLocale, to: AppLocale, signal?: AbortSignal): Promise<string> {
  throwIfAborted(signal);
  const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${from}|${to}`;
  const response = await fetch(url, { signal });
  if (!response.ok) throw new Error('translate-http');
  const json = (await response.json()) as { responseStatus?: number; responseData?: { translatedText?: string } };
  const out = json.responseData?.translatedText?.trim() ?? '';
  if (!isUsableTranslation(out) || (json.responseStatus && json.responseStatus !== 200)) {
    throw new Error('translate-empty');
  }
  return out.replace(/&quot;/g, '"').replace(/&#39;/g, "'");
}

export async function translateText(text: string, to: AppLocale, signal?: AbortSignal): Promise<string> {
  const source = text.trim();
  if (!source) return '';
  const from = detectTextLocale(source);
  if (from === to) return source;
  const chunks = splitChunks(source);
  if (!chunks.length) return '';
  const out: string[] = [];
  for (const chunk of chunks) {
    out.push(await translateChunk(chunk, from, to, signal));
  }
  return out.join('\n\n');
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

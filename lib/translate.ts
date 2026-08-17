import type { AppLocale } from '@/lib/i18n';

const CHUNK = 420;

export function detectTextLocale(text: string): AppLocale {
  if (/[əƏğĞıİöÖşŞçÇüÜ]/.test(text)) return 'az';
  if (/[А-Яа-яЁёІіЇїЄєҒғҚқҮүҰұҢңҺһ]/.test(text)) return 'ru';
  return 'en';
}

function splitChunks(text: string): string[] {
  const clean = text.trim();
  if (clean.length <= CHUNK) return clean ? [clean] : [];
  const parts: string[] = [];
  let rest = clean;
  while (rest.length > CHUNK) {
    let cut = rest.lastIndexOf(' ', CHUNK);
    if (cut < CHUNK * 0.5) cut = CHUNK;
    parts.push(rest.slice(0, cut).trim());
    rest = rest.slice(cut).trim();
  }
  if (rest) parts.push(rest);
  return parts;
}

async function translateChunk(text: string, from: AppLocale, to: AppLocale): Promise<string> {
  const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${from}|${to}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error('translate-http');
  const json = (await response.json()) as { responseStatus?: number; responseData?: { translatedText?: string } };
  const out = json.responseData?.translatedText?.trim();
  if (!out || (json.responseStatus && json.responseStatus !== 200)) throw new Error('translate-empty');
  return out.replace(/&quot;/g, '"').replace(/&#39;/g, "'");
}

export async function translateText(text: string, to: AppLocale): Promise<string> {
  const source = text.trim();
  if (!source) return '';
  const from = detectTextLocale(source);
  if (from === to) return source;
  const chunks = splitChunks(source);
  const out: string[] = [];
  for (const chunk of chunks) {
    out.push(await translateChunk(chunk, from, to));
  }
  return out.join('\n\n');
}

export type JobTextBundle = { title: string; company: string; body: string };

export async function translateJobTexts(bundle: JobTextBundle, to: AppLocale): Promise<JobTextBundle> {
  const title = await translateText(bundle.title, to);
  const company = await translateText(bundle.company, to);
  const body = await translateText(bundle.body, to);
  return { title, company, body };
}

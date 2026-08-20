import { SUPPORT_EMAIL } from '@/lib/support';

const UA = `WorklyJobs/1.0 (${SUPPORT_EMAIL})`;
const MAX_JSON_BYTES = 2_000_000;
export const DUMP_CACHE_MS = 8 * 60 * 1000;

type CacheEntry = { at: number; value: unknown };

const jsonCache = new Map<string, CacheEntry>();

function abortError(): Error {
  return Object.assign(new Error('aborted'), { name: 'AbortError' });
}

function combineSignals(timeoutSignal: AbortSignal, external?: AbortSignal): AbortSignal {
  const merged = new AbortController();
  const abort = () => merged.abort();
  if (external?.aborted || timeoutSignal.aborted) {
    abort();
    return merged.signal;
  }
  external?.addEventListener('abort', abort, { once: true });
  timeoutSignal.addEventListener('abort', abort, { once: true });
  return merged.signal;
}

async function readJson<T>(
  url: string,
  init: RequestInit & { timeoutMs?: number },
  externalSignal?: AbortSignal,
): Promise<T> {
  const { timeoutMs = 12000, headers, ...rest } = init;
  const timeoutController = new AbortController();
  let timedOut = false;
  const timer = setTimeout(() => {
    timedOut = true;
    timeoutController.abort();
  }, timeoutMs);

  try {
    const res = await fetch(url, {
      ...rest,
      signal: combineSignals(timeoutController.signal, externalSignal),
      headers: {
        Accept: 'application/json',
        'User-Agent': UA,
        ...headers,
      },
    });
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }
    const length = Number(res.headers.get('content-length'));
    if (Number.isFinite(length) && length > MAX_JSON_BYTES) {
      throw new Error('too large');
    }
    return (await res.json()) as T;
  } catch (error) {
    if (timedOut) throw new Error('timeout');
    if (externalSignal?.aborted) throw abortError();
    throw error;
  } finally {
    clearTimeout(timer);
  }
}

export async function fetchJson<T>(
  url: string,
  init: RequestInit & { timeoutMs?: number; cacheTtlMs?: number } = {},
): Promise<T> {
  const { timeoutMs, headers, signal: externalSignal, cacheTtlMs = 0, ...rest } = init;
  const method = String(rest.method ?? 'GET').toUpperCase();
  const cacheable = cacheTtlMs > 0 && method === 'GET' && rest.body == null;

  if (cacheable) {
    const hit = jsonCache.get(url);
    if (hit && Date.now() - hit.at < cacheTtlMs) {
      if (externalSignal?.aborted) throw abortError();
      return hit.value as T;
    }
  }

  if (externalSignal?.aborted) throw abortError();

  const value = await readJson<T>(url, { timeoutMs, headers, ...rest }, externalSignal ?? undefined);
  if (cacheable) jsonCache.set(url, { at: Date.now(), value });
  return value;
}

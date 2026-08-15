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

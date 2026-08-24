import { backendAnonKey, backendConfigured, backendUrl } from '@/lib/backend/config';
import { SUPPORT_EMAIL } from '@/lib/support';
import { fetchJson } from '../http';
import { isAbortError } from './errors';

export const HH_PROXY_CACHE_MS = 5 * 60 * 1000;
export const HH_API_HOST = 'https://api.hh.ru';

export const HH_HEADERS = {
  'User-Agent': `WorklyJobs/1.0 (${SUPPORT_EMAIL})`,
  'HH-User-Agent': `WorklyJobs/1.0 (${SUPPORT_EMAIL})`,
};

export function hhProxyUrl(action: 'search' | 'details', params: URLSearchParams): string {
  const url = new URL(`${backendUrl().replace(/\/$/, '')}/functions/v1/hh`);
  url.searchParams.set('action', action);
  for (const [key, value] of params) {
    if (key === 'action') continue;
    url.searchParams.append(key, value);
  }
  return url.toString();
}

export function hhDirectUrl(action: 'search' | 'details', params: URLSearchParams): string {
  if (action === 'details') {
    return `${HH_API_HOST}/vacancies/${encodeURIComponent(params.get('id') ?? '')}`;
  }
  return `${HH_API_HOST}/vacancies?${params.toString()}`;
}

export async function fetchHhApi<T>(
  action: 'search' | 'details',
  params: URLSearchParams,
  signal?: AbortSignal,
): Promise<T> {
  const direct = hhDirectUrl(action, params);
  if (backendConfigured()) {
    try {
      const key = backendAnonKey();
      return await fetchJson<T>(hhProxyUrl(action, params), {
        signal,
        cacheTtlMs: HH_PROXY_CACHE_MS,
        headers: {
          Authorization: `Bearer ${key}`,
          apikey: key,
        },
      });
    } catch (error) {
      if (isAbortError(error)) throw error;
    }
  }
  return fetchJson<T>(direct, {
    signal,
    cacheTtlMs: HH_PROXY_CACHE_MS,
    headers: HH_HEADERS,
  });
}

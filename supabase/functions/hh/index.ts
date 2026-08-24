import { parseHhRss, parseVacancyHtml, rssSearchUrl } from './parse.ts';

const HH_API = 'https://api.hh.ru';
const CACHE_MS = 5 * 60 * 1000;
const API_UA = 'WorklyJobs/1.0 (worklysupport@proton.me)';
const WEB_UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

type CacheEntry = { at: number; status: number; body: string };
const cache = new Map<string, CacheEntry>();

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  });
}

function cached(key: string): Response | null {
  const hit = cache.get(key);
  if (!hit || Date.now() - hit.at >= CACHE_MS) return null;
  return new Response(hit.body, {
    status: hit.status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  });
}

function store(key: string, status: number, body: string) {
  if (status >= 200 && status < 300) cache.set(key, { at: Date.now(), status, body });
}

async function fetchApi(url: string): Promise<Response> {
  return fetch(url, {
    headers: {
      Accept: 'application/json',
      'User-Agent': API_UA,
      'HH-User-Agent': API_UA,
    },
  });
}

async function fetchWeb(url: string, accept: string): Promise<Response> {
  return fetch(url, {
    headers: {
      Accept: accept,
      'User-Agent': WEB_UA,
      'Accept-Language': 'ru-RU,ru;q=0.9,en;q=0.8',
    },
  });
}

async function search(params: URLSearchParams): Promise<Response> {
  const key = `search:${params.toString()}`;
  const hit = cached(key);
  if (hit) return hit;

  const api = new URL(`${HH_API}/vacancies`);
  for (const [name, value] of params) {
    if (name === 'action') continue;
    api.searchParams.append(name, value);
  }
  const apiRes = await fetchApi(api.toString());
  if (apiRes.ok) {
    const body = await apiRes.text();
    store(key, apiRes.status, body);
    return new Response(body, {
      status: apiRes.status,
      headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  }

  const rssRes = await fetchWeb(rssSearchUrl(params), 'application/rss+xml, application/xml, text/xml, */*');
  const xml = await rssRes.text();
  if (!rssRes.ok) {
    return json(rssRes.status || 502, { errors: [{ type: 'forbidden' }], source: 'rss' });
  }
  const items = parseHhRss(xml);
  const body = JSON.stringify({ items, found: items.length, pages: items.length >= 20 ? 40 : 1 });
  store(key, 200, body);
  return new Response(body, {
    status: 200,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  });
}

async function details(id: string): Promise<Response> {
  const key = `details:${id}`;
  const hit = cached(key);
  if (hit) return hit;

  const apiRes = await fetchApi(`${HH_API}/vacancies/${id}`);
  if (apiRes.ok) {
    const body = await apiRes.text();
    store(key, apiRes.status, body);
    return new Response(body, {
      status: apiRes.status,
      headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  }

  const page = await fetchWeb(`https://hh.ru/vacancy/${id}`, 'text/html');
  const html = await page.text();
  if (!page.ok) return json(page.status || 502, { errors: [{ type: 'forbidden' }], source: 'html' });
  const body = JSON.stringify(parseVacancyHtml(id, html));
  store(key, 200, body);
  return new Response(body, {
    status: 200,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  if (req.method !== 'GET') return json(405, { error: 'method not allowed' });

  const url = new URL(req.url);
  const action = url.searchParams.get('action');
  try {
    if (action === 'details') {
      const id = url.searchParams.get('id')?.trim() ?? '';
      if (!/^\d+$/.test(id)) return json(400, { error: 'bad request' });
      return await details(id);
    }
    if (action === 'search') return await search(url.searchParams);
    return json(400, { error: 'bad request' });
  } catch (error) {
    return json(502, { error: error instanceof Error ? error.message : 'hh proxy failed' });
  }
});

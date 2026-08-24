const HH_HOST = 'https://api.hh.ru';
const CACHE_MS = 5 * 60 * 1000;
const UA = 'WorklyJobs/1.0 (worklysupport@proton.me)';

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

function hhUrl(reqUrl: URL): string | null {
  const action = reqUrl.searchParams.get('action');
  if (action === 'details') {
    const id = reqUrl.searchParams.get('id')?.trim();
    if (!id || !/^\d+$/.test(id)) return null;
    return `${HH_HOST}/vacancies/${id}`;
  }
  if (action !== 'search') return null;
  const upstream = new URL(`${HH_HOST}/vacancies`);
  for (const [key, value] of reqUrl.searchParams) {
    if (key === 'action') continue;
    upstream.searchParams.append(key, value);
  }
  return upstream.toString();
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS });
  }
  if (req.method !== 'GET') {
    return json(405, { error: 'method not allowed' });
  }

  const reqUrl = new URL(req.url);
  const target = hhUrl(reqUrl);
  if (!target) return json(400, { error: 'bad request' });

  const hit = cache.get(target);
  if (hit && Date.now() - hit.at < CACHE_MS) {
    return new Response(hit.body, {
      status: hit.status,
      headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  }

  const upstream = await fetch(target, {
    headers: {
      Accept: 'application/json',
      'User-Agent': UA,
      'HH-User-Agent': UA,
    },
  });
  const body = await upstream.text();
  if (upstream.ok) {
    cache.set(target, { at: Date.now(), status: upstream.status, body });
  }
  return new Response(body, {
    status: upstream.status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  });
});

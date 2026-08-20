import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { DUMP_CACHE_MS, fetchJson } from './http';

describe('fetchJson', () => {
  it('не читает тело, если Content-Length слишком большой', async () => {
    const original = globalThis.fetch;
    let readBody = false;
    globalThis.fetch = (async () => {
      const res = new Response('{"ok":true}', {
        status: 200,
        headers: { 'content-length': String(3_000_000), 'content-type': 'application/json' },
      });
      const json = res.json.bind(res);
      res.json = async () => {
        readBody = true;
        return json();
      };
      return res;
    }) as typeof fetch;
    try {
      await assert.rejects(() => fetchJson('https://example.com/dump'), /too large/);
      assert.equal(readBody, false);
    } finally {
      globalThis.fetch = original;
    }
  });

  it('кэширует дамп и не качает его повторно', async () => {
    const original = globalThis.fetch;
    let calls = 0;
    globalThis.fetch = (async () => {
      calls += 1;
      return new Response('{"ok":true}', { status: 200, headers: { 'content-type': 'application/json' } });
    }) as typeof fetch;
    try {
      const first = await fetchJson<{ ok: boolean }>('https://example.com/cache', { cacheTtlMs: DUMP_CACHE_MS });
      const second = await fetchJson<{ ok: boolean }>('https://example.com/cache', { cacheTtlMs: DUMP_CACHE_MS });
      assert.deepEqual(first, { ok: true });
      assert.deepEqual(second, { ok: true });
      assert.equal(calls, 1);
    } finally {
      globalThis.fetch = original;
    }
  });

  it('refresh обходит дамп-кэш и пишет свежий ответ', async () => {
    const original = globalThis.fetch;
    let calls = 0;
    globalThis.fetch = (async () => {
      calls += 1;
      return new Response(JSON.stringify({ n: calls }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      });
    }) as typeof fetch;
    try {
      const cached = await fetchJson<{ n: number }>('https://example.com/bypass', { cacheTtlMs: DUMP_CACHE_MS });
      const fresh = await fetchJson<{ n: number }>('https://example.com/bypass', {
        cacheTtlMs: DUMP_CACHE_MS,
        bypassCache: true,
      });
      const after = await fetchJson<{ n: number }>('https://example.com/bypass', { cacheTtlMs: DUMP_CACHE_MS });
      assert.equal(cached.n, 1);
      assert.equal(fresh.n, 2);
      assert.equal(after.n, 2);
      assert.equal(calls, 2);
    } finally {
      globalThis.fetch = original;
    }
  });

  it('abort не кладёт дамп в кэш', async () => {
    const original = globalThis.fetch;
    let calls = 0;
    let started: () => void = () => undefined;
    const startedAt = new Promise<void>((resolve) => {
      started = resolve;
    });
    globalThis.fetch = (async (_input, init) => {
      calls += 1;
      if (calls === 1) {
        started();
        await new Promise<never>((_, reject) => {
          const signal = init?.signal;
          if (signal?.aborted) {
            reject(Object.assign(new Error('aborted'), { name: 'AbortError' }));
            return;
          }
          signal?.addEventListener(
            'abort',
            () => reject(Object.assign(new Error('aborted'), { name: 'AbortError' })),
            { once: true },
          );
        });
      }
      return new Response('{"ok":true}', { status: 200, headers: { 'content-type': 'application/json' } });
    }) as typeof fetch;
    try {
      const controller = new AbortController();
      const first = fetchJson('https://example.com/abort-cache', {
        cacheTtlMs: DUMP_CACHE_MS,
        signal: controller.signal,
      });
      await startedAt;
      controller.abort();
      await assert.rejects(first, (error: unknown) => error instanceof Error && error.name === 'AbortError');
      const second = await fetchJson<{ ok: boolean }>('https://example.com/abort-cache', { cacheTtlMs: DUMP_CACHE_MS });
      assert.deepEqual(second, { ok: true });
      assert.equal(calls, 2);
    } finally {
      globalThis.fetch = original;
    }
  });
});

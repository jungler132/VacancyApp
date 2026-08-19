import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { fetchJson } from './http';

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
});

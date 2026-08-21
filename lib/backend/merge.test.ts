import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { isRemoteUri, keepRemoteUrl, mergeById, pickNewer, preferMediaUri } from './merge';

describe('backend merge', () => {
  it('берёт более новый updatedAt', () => {
    const older = { id: '1', updatedAt: '2026-08-01T00:00:00.000Z', title: 'old' };
    const newer = { id: '1', updatedAt: '2026-08-18T00:00:00.000Z', title: 'new' };
    assert.equal(pickNewer(older, newer)?.title, 'new');
    assert.equal(pickNewer(newer, older)?.title, 'new');
    assert.equal(pickNewer(older, null)?.title, 'old');
  });

  it('сливает списки по id без дублей', () => {
    const out = mergeById(
      [
        { id: 'a', updatedAt: '2026-08-01T00:00:00.000Z', title: 'local' },
        { id: 'b', updatedAt: '2026-08-02T00:00:00.000Z', title: 'only-local' },
      ],
      [
        { id: 'a', updatedAt: '2026-08-10T00:00:00.000Z', title: 'remote' },
        { id: 'c', updatedAt: '2026-08-03T00:00:00.000Z', title: 'only-remote' },
      ],
    );
    const byId = Object.fromEntries(out.map((item) => [item.id, item.title]));
    assert.equal(byId.a, 'remote');
    assert.equal(byId.b, 'only-local');
    assert.equal(byId.c, 'only-remote');
    assert.equal(out.length, 3);
  });

  it('видит http как уже загруженное', () => {
    assert.equal(isRemoteUri('https://x.test/a.jpg'), true);
    assert.equal(isRemoteUri('file:///tmp/a.jpg'), false);
  });

  it('не затирает готовый url локальным файлом', () => {
    assert.equal(keepRemoteUrl('file:///a.jpg', 'https://cdn.example/a.jpg'), 'https://cdn.example/a.jpg');
    assert.equal(keepRemoteUrl('https://cdn.example/b.jpg', 'https://cdn.example/a.jpg'), 'https://cdn.example/b.jpg');
    assert.equal(keepRemoteUrl('file:///a.jpg', 'file:///b.jpg'), undefined);
  });

  it('на pull оставляет локальный файл, если в облаке аватарки ещё нет', () => {
    assert.equal(preferMediaUri(undefined, 'file:///a.jpg'), 'file:///a.jpg');
    assert.equal(preferMediaUri('https://cdn.example/a.jpg', 'file:///a.jpg'), 'https://cdn.example/a.jpg');
  });
});

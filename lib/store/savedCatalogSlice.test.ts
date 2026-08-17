import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { JOB_SITES, TELEGRAM_GROUPS } from '../telegramGroups';
import reducer, { parseSavedCatalog, toSavedCatalogItem, toggleSavedCatalog } from './savedCatalogSlice';

describe('savedCatalog', () => {
  it('парсит только валидные записи и обновляет их из каталога', () => {
    const site = JOB_SITES[0];
    const parsed = parseSavedCatalog([
      { kind: 'site', id: site.id, title: 'Старое имя', url: site.url, country: site.country },
      { kind: 'nope', id: 'x', title: 'x', url: 'https://x', country: 'ru' },
      { kind: 'site', id: site.id, title: 'Дубль', url: site.url, country: site.country },
    ]);
    assert.equal(parsed.length, 1);
    assert.equal(parsed[0].id, site.id);
    assert.equal(parsed[0].title, site.title);
  });

  it('добавляет и убирает канал по звезде', () => {
    const channel = toSavedCatalogItem(TELEGRAM_GROUPS[0], true);
    const added = reducer({ items: [], ready: true }, toggleSavedCatalog(channel));
    assert.equal(added.items.length, 1);
    assert.equal(added.items[0].kind, 'telegram');
    const removed = reducer(added, toggleSavedCatalog(channel));
    assert.equal(removed.items.length, 0);
  });
});

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import visitsReducer, { clearVisits, parseVisits, rankVisits, recordVisit, removeVisit, type SiteVisit } from './visitsSlice';

describe('visits', () => {
  it('ранжирует по числу открытий, потом по свежести', () => {
    const items: SiteVisit[] = [
      { id: 'a', title: 'A', url: 'https://a', kind: 'site', count: 2, lastAt: 10 },
      { id: 'b', title: 'B', url: 'https://b', kind: 'site', count: 5, lastAt: 1 },
      { id: 'c', title: 'C', url: 'https://c', kind: 'telegram', count: 2, lastAt: 20 },
    ];
    assert.deepEqual(
      rankVisits(items).map((item) => item.id),
      ['b', 'c', 'a'],
    );
  });

  it('отбрасывает битые записи', () => {
    const parsed = parseVisits([{ id: 'ok', title: 'HH', url: 'https://hh.ru', kind: 'site', count: 3, lastAt: 1 }, { id: 1 }]);
    assert.equal(parsed.length, 1);
    assert.equal(parsed[0]?.id, 'ok');
  });

  it('чистит одну запись и весь список', () => {
    let state = visitsReducer(undefined, { type: 'unknown' });
    state = visitsReducer(state, recordVisit({ id: 'a', title: 'A', url: 'https://a', kind: 'site' }));
    state = visitsReducer(state, recordVisit({ id: 'b', title: 'B', url: 'https://b', kind: 'telegram' }));
    state = visitsReducer(state, removeVisit('a'));
    assert.deepEqual(state.items.map((item) => item.id), ['b']);
    state = visitsReducer(state, clearVisits());
    assert.equal(state.items.length, 0);
  });
});

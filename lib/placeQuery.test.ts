import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { adzunaTarget, joobleLang, joobleLocation, trudvsemPlace } from './placeQuery';

describe('placeQuery', () => {
  it('Jooble берёт английское имя города или страны', () => {
    assert.equal(joobleLocation('baku', 'all'), 'Baku');
    assert.equal(joobleLocation('country:az', 'all'), 'Azerbaijan');
    assert.equal(joobleLocation('moscow', 'cis'), 'Moscow');
    assert.equal(joobleLocation('', 'cis'), 'Russia');
    assert.equal(joobleLocation(undefined, 'az'), 'Azerbaijan');
  });

  it('Jooble выбирает язык по стране места', () => {
    assert.equal(joobleLang('baku', 'all'), 'az');
    assert.equal(joobleLang('moscow', 'all'), 'ru');
    assert.equal(joobleLang('berlin', 'all'), 'en');
    assert.equal(joobleLang('', 'az'), 'az');
  });

  it('Adzuna сужает страну и where, иначе пропускает СНГ', () => {
    assert.deepEqual(adzunaTarget('berlin', 'all', 0), { country: 'de', where: 'Berlin' });
    assert.deepEqual(adzunaTarget('country:gb', 'all', 0), { country: 'gb' });
    assert.equal(adzunaTarget('baku', 'all', 0), null);
    assert.equal(adzunaTarget('moscow', 'cis', 0), null);
    assert.deepEqual(adzunaTarget('', 'west', 0), { country: 'us' });
    assert.equal(adzunaTarget('', 'az', 0), null);
  });

  it('Trudvsem ходит в регион только по российским городам', () => {
    assert.deepEqual(trudvsemPlace(undefined), { kind: 'all' });
    assert.deepEqual(trudvsemPlace('country:ru'), { kind: 'all' });
    assert.deepEqual(trudvsemPlace('moscow'), { kind: 'region', code: '7700000000000' });
    assert.deepEqual(trudvsemPlace('spb'), { kind: 'region', code: '7800000000000' });
    assert.deepEqual(trudvsemPlace('baku'), { kind: 'skip' });
    assert.deepEqual(trudvsemPlace('country:az'), { kind: 'skip' });
  });
});

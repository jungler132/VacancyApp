import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { DEFAULT_EXTRA_FILTERS, filterFeedIds, jobMatchesExtra, type ExtraFilters } from './filters';
import { toggleCategory } from './catalog';
import type { Job } from './types';

const now = new Date().toISOString();

function job(partial: Partial<Job> & Pick<Job, 'id'>): Job {
  return {
    sourceId: 'hh',
    sourceName: 'HeadHunter',
    title: 'Разработчик',
    company: 'Acme',
    location: 'Москва',
    remote: false,
    url: 'https://example.com',
    excerpt: 'Описание',
    publishedAt: now,
    ...partial,
  };
}

function extra(overrides: Partial<ExtraFilters> = {}): ExtraFilters {
  return { ...DEFAULT_EXTRA_FILTERS, ...overrides };
}

describe('filterFeedIds', () => {
  it('пропускает id без job в byId', () => {
    const ids = filterFeedIds(['missing', 'ok'], { ok: job({ id: 'ok' }) }, ['all']);
    assert.deepEqual(ids, ['ok']);
  });

  it('фильтрует удалёнку', () => {
    const byId = {
      r: job({ id: 'r', remote: true }),
      o: job({ id: 'o', remote: false }),
    };
    assert.deepEqual(filterFeedIds(['r', 'o'], byId, ['all'], extra({ format: 'remote' })), ['r']);
    assert.deepEqual(filterFeedIds(['r', 'o'], byId, ['all'], extra({ format: 'office' })), ['o']);
  });

  it('не режет ленту по числу зарплаты', () => {
    const byId = {
      low: job({ id: 'low', salary: '80 000 ₽' }),
      usd: job({ id: 'usd', salary: '$4,000' }),
    };
    assert.deepEqual(filterFeedIds(['low', 'usd'], byId, ['all']), ['low', 'usd']);
  });

  it('при нескольких категориях оставляет подходящие', () => {
    const byId = {
      it: job({ id: 'it', title: 'Программист Python' }),
      cook: job({ id: 'cook', title: 'Повар суши' }),
    };
    const ids = filterFeedIds(['it', 'cook'], byId, ['it', 'hospitality']);
    assert.ok(ids.includes('it'));
    assert.ok(ids.includes('cook'));
  });

  it('сохраняет порядок ленты и не пересортировывает при подгрузке', () => {
    const newer = new Date(Date.now() - 3600_000).toISOString();
    const older = new Date(Date.now() - 48 * 3600_000).toISOString();
    const byId = {
      old: job({ id: 'old', title: 'A', publishedAt: older }),
      fresh: job({ id: 'fresh', title: 'B', publishedAt: newer }),
    };
    assert.deepEqual(filterFeedIds(['old', 'fresh'], byId, ['all']), ['old', 'fresh']);
  });
});

describe('jobMatchesExtra', () => {
  it('режет вакансии старше выбранной давности', () => {
    const stale = job({
      id: 'stale',
      publishedAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
    });
    assert.equal(jobMatchesExtra(stale, extra({ maxAgeDays: 7 })), false);
    assert.equal(jobMatchesExtra(stale, extra({ maxAgeDays: 30 })), true);
  });

  it('фильтрует по городу из списка', () => {
    const baku = job({ id: 'baku', location: 'Баку', cityId: 'baku' });
    const moscow = job({ id: 'msk', location: 'Москва', cityId: 'moscow' });
    assert.equal(jobMatchesExtra(baku, extra({ placeId: 'baku' })), true);
    assert.equal(jobMatchesExtra(moscow, extra({ placeId: 'baku' })), false);
    assert.equal(jobMatchesExtra(baku, extra({ placeId: 'country:az' })), true);
  });
});

describe('toggleCategory', () => {
  it('не даёт выбрать две сферы сразу', () => {
    assert.deepEqual(toggleCategory(['all'], 'it'), ['it']);
    assert.deepEqual(toggleCategory(['it'], 'home'), ['home']);
    assert.deepEqual(toggleCategory(['it'], 'it'), ['all']);
    assert.deepEqual(toggleCategory(['it', 'home'], 'sales'), ['sales']);
  });
});

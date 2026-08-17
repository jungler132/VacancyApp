import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { DEFAULT_EXTRA_FILTERS, filterFeedIds, jobMatchesExtra, type ExtraFilters } from './filters';
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

  it('фильтрует по минимальной зарплате', () => {
    const byId = {
      low: job({ id: 'low', salary: '80 000 ₽' }),
      high: job({ id: 'high', salary: '200 000 ₽' }),
    };
    assert.deepEqual(filterFeedIds(['low', 'high'], byId, ['all'], extra({ salaryMin: 120_000 })), ['high']);
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
});

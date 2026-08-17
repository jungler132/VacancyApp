import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { DEFAULT_EXTRA_FILTERS } from './filters';
import { jobTier, mergeVisibleIds } from './tiers';
import type { Job } from './types';

const now = new Date().toISOString();
const older = new Date(Date.now() - 48 * 3600_000).toISOString();

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

describe('jobTier', () => {
  it('внешние вакансии без поля — T3', () => {
    assert.equal(jobTier(job({ id: 'hh-1' })), 3);
  });

  it('workly без tier — T2', () => {
    assert.equal(jobTier(job({ id: 'workly:1', sourceId: 'workly' })), 2);
  });
});

describe('mergeVisibleIds', () => {
  it('ставит T1 выше T2 и T3, внутри тира свежие выше', () => {
    const t3old = job({ id: 't3', title: 'T3', publishedAt: older });
    const t2 = job({ id: 'workly:2', sourceId: 'workly', sourceName: 'Workly', title: 'T2', tier: 2, url: '' });
    const t1 = job({
      id: 'workly:1',
      sourceId: 'workly',
      sourceName: 'Workly',
      title: 'T1',
      tier: 1,
      url: '',
    });
    const byId = { t3: t3old };
    const ids = mergeVisibleIds(['t3'], [t1, t2], byId, {
      query: '',
      region: 'cis',
      categories: ['all'],
      extra: DEFAULT_EXTRA_FILTERS,
      tierFilter: 'all',
    });
    assert.deepEqual(ids, ['workly:1', 'workly:2', 't3']);
  });

  it('фильтр Премиум прячет площадки и T2', () => {
    const t3 = job({ id: 't3' });
    const t2 = job({ id: 'workly:2', sourceId: 'workly', sourceName: 'Workly', tier: 2, url: '' });
    const t1 = job({ id: 'workly:1', sourceId: 'workly', sourceName: 'Workly', tier: 1, url: '' });
    const ids = mergeVisibleIds(['t3'], [t1, t2], { t3 }, {
      query: '',
      region: 'cis',
      categories: ['all'],
      extra: DEFAULT_EXTRA_FILTERS,
      tierFilter: 1,
    });
    assert.deepEqual(ids, ['workly:1']);
  });

  it('создание локальной вакансии не требует её в feed.ids', () => {
    const local = job({ id: 'workly:new', sourceId: 'workly', sourceName: 'Workly', tier: 2, url: '' });
    const ids = mergeVisibleIds([], [local], {}, {
      query: '',
      region: 'cis',
      categories: ['all'],
      extra: DEFAULT_EXTRA_FILTERS,
      tierFilter: 'all',
    });
    assert.deepEqual(ids, ['workly:new']);
  });

  it('не вставляет новые площадки в середину уже показанной ленты', () => {
    const older = new Date(Date.now() - 48 * 3600_000).toISOString();
    const newer = new Date().toISOString();
    const first = job({ id: 'first', title: 'Старая', publishedAt: older });
    const next = job({ id: 'next', title: 'Свежая', publishedAt: newer });
    const ids = mergeVisibleIds(['first', 'next'], [], { first, next }, {
      query: '',
      region: 'cis',
      categories: ['all'],
      extra: DEFAULT_EXTRA_FILTERS,
      tierFilter: 'all',
    });
    assert.deepEqual(ids, ['first', 'next']);
  });
});

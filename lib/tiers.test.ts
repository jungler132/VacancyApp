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

  it('vakano без tier — T2', () => {
    assert.equal(jobTier(job({ id: 'vakano:1', sourceId: 'vakano' })), 2);
  });

  it('старый sourceId workly без tier — T2', () => {
    assert.equal(jobTier(job({ id: 'workly:1', sourceId: 'workly' })), 2);
  });
});

describe('mergeVisibleIds', () => {
  it('ставит T1 выше T2 и T3, внутри тира свежие выше', () => {
    const t3old = job({ id: 't3', title: 'T3', publishedAt: older });
    const t2 = job({ id: 'vakano:2', sourceId: 'vakano', sourceName: 'Vakano', title: 'T2', tier: 2, url: '' });
    const t1 = job({
      id: 'vakano:1',
      sourceId: 'vakano',
      sourceName: 'Vakano',
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
    assert.deepEqual(ids, ['vakano:1', 'vakano:2', 't3']);
  });

  it('фильтр Премиум прячет площадки и T2', () => {
    const t3 = job({ id: 't3' });
    const t2 = job({ id: 'vakano:2', sourceId: 'vakano', sourceName: 'Vakano', tier: 2, url: '' });
    const t1 = job({ id: 'vakano:1', sourceId: 'vakano', sourceName: 'Vakano', tier: 1, url: '' });
    const ids = mergeVisibleIds(['t3'], [t1, t2], { t3 }, {
      query: '',
      region: 'cis',
      categories: ['all'],
      extra: DEFAULT_EXTRA_FILTERS,
      tierFilter: 1,
    });
    assert.deepEqual(ids, ['vakano:1']);
  });

  it('создание локальной вакансии не требует её в feed.ids', () => {
    const local = job({ id: 'vakano:new', sourceId: 'vakano', sourceName: 'Vakano', tier: 2, url: '' });
    const ids = mergeVisibleIds([], [local], {}, {
      query: '',
      region: 'cis',
      categories: ['all'],
      extra: DEFAULT_EXTRA_FILTERS,
      tierFilter: 'all',
    });
    assert.deepEqual(ids, ['vakano:new']);
  });

  it('не показывает архивную вакансию в ленте', () => {
    const archived = job({
      id: 'vakano:old',
      sourceId: 'vakano',
      sourceName: 'Vakano',
      tier: 2,
      url: '',
      archived: true,
    });
    const live = job({ id: 'vakano:live', sourceId: 'vakano', sourceName: 'Vakano', tier: 2, url: '' });
    const ids = mergeVisibleIds([], [archived, live], {}, {
      query: '',
      region: 'cis',
      categories: ['all'],
      extra: DEFAULT_EXTRA_FILTERS,
      tierFilter: 'all',
    });
    assert.deepEqual(ids, ['vakano:live']);
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

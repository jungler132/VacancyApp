import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { DEFAULT_EXTRA_FILTERS } from './filters';
import { mergeAlertHits, normalizeAlerts, slimJob, type SavedSearch } from './alertModel';
import { collectNewJobs } from './today';
import type { Job } from './types';

function job(partial: Partial<Job> & Pick<Job, 'id' | 'title'>): Job {
  return {
    sourceId: 'hh',
    sourceName: 'HH',
    company: 'Acme',
    location: 'Баку',
    remote: false,
    url: `https://example.com/${partial.id}`,
    excerpt: partial.title,
    ...partial,
  };
}

function saved(partial: Partial<SavedSearch> & Pick<SavedSearch, 'id'>): SavedSearch {
  return {
    query: 'react',
    region: 'all',
    categories: ['it'],
    extra: DEFAULT_EXTRA_FILTERS,
    enabled: true,
    lastSeenIds: [],
    lastCheckedAt: 0,
    lastNotifiedAt: 0,
    createdAt: 1,
    pendingNew: 0,
    pendingNewIds: [],
    pendingJobs: [],
    ...partial,
  };
}

describe('mergeAlertHits', () => {
  const now = 1_000;

  it('первый проход только запоминает id, без pending', () => {
    const alert = saved({ id: 'a1' });
    const a = job({ id: 'j1', title: 'React' });
    const result = mergeAlertHits(alert, ['j1'], [a], now);
    assert.equal(result.seeded, true);
    assert.deepEqual(result.fresh, []);
    assert.deepEqual(alert.lastSeenIds, ['j1']);
    assert.equal(alert.pendingNew, 0);
    assert.equal(alert.lastCheckedAt, now);
  });

  it('второй проход кладёт новые вакансии в pendingJobs', () => {
    const alert = saved({ id: 'a1', lastSeenIds: ['j1'] });
    const b = job({ id: 'j2', title: 'React two', description: 'очень длинное описание'.repeat(20) });
    const result = mergeAlertHits(alert, ['j1', 'j2'], [b, job({ id: 'j1', title: 'old' })], now);
    assert.equal(result.seeded, false);
    assert.equal(result.fresh.length, 1);
    assert.equal(alert.pendingNew, 1);
    assert.deepEqual(alert.pendingNewIds, ['j2']);
    assert.equal(alert.pendingJobs[0]?.id, 'j2');
    assert.equal(alert.pendingJobs[0]?.description, undefined);
    assert.ok((alert.pendingJobs[0]?.excerpt.length ?? 0) <= 280);
  });
});

describe('normalizeAlerts', () => {
  it('поднимает pendingJobs только для известных id', () => {
    const items = normalizeAlerts([
      {
        id: 'a1',
        region: 'cis',
        pendingNewIds: ['j2'],
        pendingJobs: [slimJob(job({ id: 'j2', title: 'Keep' })), slimJob(job({ id: 'gone', title: 'Drop' }))],
      },
    ]);
    assert.equal(items[0]?.pendingJobs.length, 1);
    assert.equal(items[0]?.pendingJobs[0]?.id, 'j2');
  });
});

describe('collectNewJobs', () => {
  it('берёт карточку из pendingJobs, даже если её нет в кэше ленты', () => {
    const card = job({ id: 'j2', title: 'From alert' });
    const jobs = collectNewJobs({
      alerts: [
        {
          id: 'a1',
          query: 'react',
          region: 'all',
          categories: ['it'],
          extra: DEFAULT_EXTRA_FILTERS,
          enabled: true,
          pendingNew: 1,
          pendingNewIds: ['j2'],
          pendingJobs: [slimJob(card)],
        },
      ],
      jobsById: {},
      savedJobs: [],
    });
    assert.equal(jobs.length, 1);
    assert.equal(jobs[0]?.id, 'j2');
  });
});

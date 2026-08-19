import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { DEFAULT_EXTRA_FILTERS } from './filters';
import { jobMatchesPrefs, parseSeekPrefs, prefsFilled, searchFromPrefs } from './prefs';
import { parseIdentity } from './store/identitySlice';
import { todayCard, todayDigest } from './today';
import type { Job } from './types';

function job(partial: Partial<Job> & Pick<Job, 'id' | 'title'>): Job {
  return {
    sourceId: 'hh',
    sourceName: 'HH',
    company: 'Acme',
    location: '',
    remote: false,
    url: 'https://example.com/1',
    excerpt: '',
    ...partial,
  };
}

describe('prefs', () => {
  it('читает должность и формат, режет длинное название', () => {
    const parsed = parseSeekPrefs({
      title: `  ${'A'.repeat(90)}  `,
      format: 'remote',
    });
    assert.equal(parsed.title.length, 80);
    assert.equal(parsed.format, 'remote');
    assert.equal(prefsFilled(parsed), true);
    assert.equal(prefsFilled(parseSeekPrefs(null)), false);
  });

  it('матчит вакансию по должности и удалёнке', () => {
    const prefs = parseSeekPrefs({ title: 'React Native', format: 'remote' });
    const hit = job({
      id: '1',
      title: 'React Native Developer',
      remote: true,
    });
    const office = { ...hit, id: '2', remote: false };
    const otherRole = { ...hit, id: '3', title: 'Cook' };
    assert.equal(jobMatchesPrefs(hit, prefs), true);
    assert.equal(jobMatchesPrefs(office, prefs), false);
    assert.equal(jobMatchesPrefs(otherRole, prefs), false);
  });

  it('собирает поиск из предпочтений', () => {
    const search = searchFromPrefs(parseSeekPrefs({ title: 'продавец', format: 'remote' }));
    assert.equal(search.query, 'продавец');
    assert.equal(search.region, 'remote');
    assert.equal(search.extra.format, 'remote');
    assert.equal(search.extra.employment, DEFAULT_EXTRA_FILTERS.employment);
  });
});

describe('identity prefs persist', () => {
  it('оставляет старый JSON и дополняет предпочтения', () => {
    assert.deepEqual(parseIdentity(null), {
      seeking: true,
      available: false,
      title: '',
      format: 'any',
    });
    const parsed = parseIdentity({ seeking: false, available: true, title: 'Dev', format: 'office' });
    assert.equal(parsed.seeking, false);
    assert.equal(parsed.available, true);
    assert.equal(parsed.title, 'Dev');
    assert.equal(parsed.format, 'office');
  });
});

describe('today digest', () => {
  const now = Date.parse('2026-08-18T12:00:00.000Z');

  it('складывает новые из алертов, сдвиги за день и протухшую вакансию', () => {
    const stale = job({
      id: 'old',
      title: 'Senior Dev',
      publishedAt: new Date(now - 20 * 24 * 60 * 60 * 1000).toISOString(),
    });
    const fresh = job({
      id: 'new',
      title: 'Junior',
      publishedAt: new Date(now - 2 * 60 * 60 * 1000).toISOString(),
    });
    const n1 = job({ id: 'n1', title: 'React one', publishedAt: new Date(now - 60 * 60 * 1000).toISOString() });
    const n2 = job({ id: 'n2', title: 'React two', publishedAt: new Date(now - 90 * 60 * 1000).toISOString() });
    const digest = todayDigest({
      now,
      alerts: [
        {
          id: 'a1',
          query: 'react',
          region: 'all',
          categories: ['it'],
          extra: DEFAULT_EXTRA_FILTERS,
          enabled: true,
          pendingNew: 2,
          pendingNewIds: ['n1', 'n2'],
        },
        {
          id: 'a2',
          query: 'sales',
          region: 'cis',
          categories: ['sales'],
          extra: DEFAULT_EXTRA_FILTERS,
          enabled: true,
          pendingNew: 2,
        },
      ],
      cachedJobs: [fresh, n1, n2],
      savedJobs: [stale, fresh],
      statuses: { old: 'applied', new: 'interview' },
      statusAt: {
        old: new Date(now - 20 * 24 * 60 * 60 * 1000).toISOString(),
        new: new Date(now - 60 * 60 * 1000).toISOString(),
      },
      prefs: parseSeekPrefs({ title: 'Junior' }),
    });
    assert.equal(digest.newCount, 2);
    assert.deepEqual(digest.newJobs.map((item) => item.id).sort(), ['n1', 'n2']);
    assert.equal(digest.alertCount, 2);
    assert.equal(digest.alert?.id, 'a1');
    assert.equal(digest.moves, 1);
    assert.equal(digest.staleCount, 1);
    assert.equal(digest.staleJob?.id, 'old');
    assert.equal(digest.staleJob?.ageDays, 20);
  });

  it('карточка «Сегодня» не сканирует кэш вакансий', () => {
    const card = todayCard({
      now,
      alerts: [
        {
          id: 'a1',
          query: 'react',
          region: 'all',
          categories: ['it'],
          extra: DEFAULT_EXTRA_FILTERS,
          enabled: true,
          pendingNew: 2,
          pendingNewIds: ['n1', 'n2'],
        },
      ],
      savedJobs: [],
      statuses: {},
      statusAt: {},
    });
    assert.equal(card.newCount, 2);
    assert.equal(card.alert?.id, 'a1');
  });

  it('без алертов считает свежие из кэша по предпочтениям', () => {
    const hit = job({
      id: 'c1',
      title: 'React Native Developer',
      remote: true,
      publishedAt: new Date(now - 30 * 60 * 1000).toISOString(),
    });
    const miss = job({
      id: 'c2',
      title: 'Cook',
      remote: true,
      publishedAt: new Date(now - 30 * 60 * 1000).toISOString(),
    });
    const digest = todayDigest({
      now,
      alerts: [],
      cachedJobs: [hit, miss],
      savedJobs: [],
      statuses: {},
      statusAt: {},
      prefs: parseSeekPrefs({ title: 'React Native', format: 'remote' }),
    });
    assert.equal(digest.newCount, 1);
    assert.equal(digest.newJobs[0]?.id, 'c1');
    assert.equal(digest.alert, null);
  });
});

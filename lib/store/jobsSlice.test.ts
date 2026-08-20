import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { CACHE_TTL_MS, shouldFetchFeed, type FeedCache } from './jobsSlice';

function feed(partial: Partial<FeedCache> = {}): FeedCache {
  return {
    ids: [],
    page: 0,
    hasMore: true,
    exhaustedSources: [],
    errors: [],
    fetchedAt: 0,
    status: 'idle',
    ...partial,
  };
}

describe('shouldFetchFeed', () => {
  it('первый заход всегда грузит ленту', () => {
    assert.equal(shouldFetchFeed(undefined, 'replace'), true);
    assert.equal(shouldFetchFeed(feed({ status: 'idle' }), 'replace'), true);
  });

  it('не стартует второй replace, пока первый ещё loading', () => {
    assert.equal(shouldFetchFeed(feed({ status: 'loading' }), 'replace'), false);
  });

  it('после abort (idle, пусто) снова грузит площадки', () => {
    assert.equal(shouldFetchFeed(feed({ status: 'idle', ids: [], fetchedAt: 0 }), 'replace'), true);
  });

  it('готовая пустая лента не крутится сразу повторно', () => {
    assert.equal(
      shouldFetchFeed(feed({ status: 'ready', ids: [], fetchedAt: Date.now() }), 'replace'),
      false,
    );
  });

  it('свежий кэш с вакансиями не перезапрашивает', () => {
    assert.equal(
      shouldFetchFeed(feed({ status: 'ready', ids: ['hh:1'], fetchedAt: Date.now() }), 'replace'),
      false,
    );
  });

  it('просроченный кэш перезапрашивает', () => {
    assert.equal(
      shouldFetchFeed(
        feed({ status: 'ready', ids: ['hh:1'], fetchedAt: Date.now() - CACHE_TTL_MS - 1 }),
        'replace',
      ),
      true,
    );
  });

  it('refresh можно нажать даже если replace завис в loading', () => {
    assert.equal(shouldFetchFeed(feed({ status: 'loading' }), 'refresh'), true);
    assert.equal(shouldFetchFeed(feed({ status: 'refreshing' }), 'refresh'), false);
  });
});

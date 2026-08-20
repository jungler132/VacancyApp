import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import reducer, {
  CACHE_TTL_MS,
  fetchFeed,
  ingestFeedBatch,
  makeFeedKey,
  shouldFetchFeed,
  type FeedCache,
} from './jobsSlice';
import type { Job } from '../types';

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

const feedArgs = {
  query: '',
  region: 'cis' as const,
  category: 'all' as const,
  enabledSources: ['hh'],
  page: 0,
  mode: 'replace' as const,
};
const feedKey = makeFeedKey('', 'cis', 'all', ['hh']);

function boardJob(id: string, title: string): Job {
  return {
    id,
    sourceId: 'hh',
    sourceName: 'HeadHunter',
    title,
    company: 'Acme',
    location: 'Москва',
    remote: false,
    url: 'https://example.com',
    excerpt: title,
  };
}

describe('ingestFeedBatch', () => {
  it('кладёт пакет текущего запроса до конца загрузки', () => {
    let state = reducer(undefined, { type: '@@init' });
    state = reducer(state, {
      type: fetchFeed.pending.type,
      meta: { arg: feedArgs, requestId: 'b' },
    });
    state = reducer(
      state,
      ingestFeedBatch({
        key: feedKey,
        requestId: 'b',
        mode: 'replace',
        jobs: [boardJob('hh:1', 'Dev')],
      }),
    );
    assert.deepEqual(state.feeds[feedKey]?.ids, ['hh:1']);
    assert.equal(state.feeds[feedKey]?.status, 'loading');
  });

  it('игнорирует пакет старого запроса', () => {
    let state = reducer(undefined, { type: '@@init' });
    state = reducer(state, {
      type: fetchFeed.pending.type,
      meta: { arg: feedArgs, requestId: 'b' },
    });
    state = reducer(
      state,
      ingestFeedBatch({
        key: feedKey,
        requestId: 'a',
        mode: 'replace',
        jobs: [boardJob('hh:old', 'Old')],
      }),
    );
    assert.deepEqual(state.feeds[feedKey]?.ids, []);
    assert.equal(state.byId['hh:old'], undefined);
  });

  it('abort старого запроса не сбрасывает новый', () => {
    let state = reducer(undefined, { type: '@@init' });
    state = reducer(state, {
      type: fetchFeed.pending.type,
      meta: { arg: feedArgs, requestId: 'a' },
    });
    state = reducer(state, {
      type: fetchFeed.pending.type,
      meta: { arg: { ...feedArgs, mode: 'refresh' }, requestId: 'b' },
    });
    state = reducer(state, {
      type: fetchFeed.rejected.type,
      error: { name: 'AbortError', message: 'aborted' },
      meta: { arg: feedArgs, requestId: 'a', aborted: true },
    });
    assert.equal(state.feeds[feedKey]?.requestId, 'b');
    assert.equal(state.feeds[feedKey]?.status, 'refreshing');
  });
});

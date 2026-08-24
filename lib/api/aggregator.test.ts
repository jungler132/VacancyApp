import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { searchJobs, type JobProvider } from './aggregator';
import type { Job, SearchParams } from '../types';

const now = new Date().toISOString();
const old = new Date(Date.now() - 120 * 24 * 60 * 60 * 1000).toISOString();

function job(partial: Partial<Job> & Pick<Job, 'id' | 'title'>): Job {
  return {
    sourceId: 'hh',
    sourceName: 'HeadHunter',
    company: 'Acme',
    location: 'Москва',
    remote: false,
    url: 'https://example.com',
    excerpt: 'Вакансия разработчика',
    publishedAt: now,
    ...partial,
  };
}

function params(overrides: Partial<SearchParams> = {}): SearchParams {
  return {
    query: '',
    region: 'cis',
    category: 'all',
    page: 0,
    enabledSources: ['a', 'b'],
    ...overrides,
  };
}

function provider(
  id: string,
  run: JobProvider['run'],
  extra?: Partial<Pick<JobProvider, 'regions' | 'paginated' | 'pageSize'>>,
): JobProvider {
  return {
    id,
    run,
    regions: extra?.regions ?? ['cis', 'all'],
    paginated: extra?.paginated,
    pageSize: extra?.pageSize,
  };
}

describe('searchJobs', () => {
  it('дедупит вакансии с одним title и company', async () => {
    const result = await searchJobs(params({ enabledSources: ['a', 'b'] }), [
      provider('a', async () => [job({ id: '1', title: 'React Dev', company: 'Acme' })]),
      provider('b', async () => [job({ id: '2', title: 'React Dev', company: 'Acme' })]),
    ]);
    assert.equal(result.jobs.length, 1);
    assert.equal(result.jobs[0]?.id, '1');
  });

  it('нормализует пробелы и регистр при дедупе', async () => {
    const result = await searchJobs(params({ enabledSources: ['a', 'b'] }), [
      provider('a', async () => [job({ id: '1', title: 'React  Dev', company: 'Acme' })]),
      provider('b', async () => [job({ id: '2', title: 'react dev', company: 'acme' })]),
    ]);
    assert.equal(result.jobs.length, 1);
  });

  it('не запускает провайдер чужого региона', async () => {
    const called: string[] = [];
    await searchJobs(params({ region: 'az', enabledSources: ['az', 'cis'] }), [
      provider(
        'az',
        async () => {
          called.push('az');
          return [job({ id: 'az-1', title: 'Baku job', sourceId: 'az' })];
        },
        { regions: ['az'] },
      ),
      provider(
        'cis',
        async () => {
          called.push('cis');
          return [job({ id: 'cis-1', title: 'Moscow job', sourceId: 'cis' })];
        },
        { regions: ['cis'] },
      ),
    ]);
    assert.deepEqual(called, ['az']);
  });

  it('провайдер с regions any работает в любом регионе', async () => {
    const result = await searchJobs(params({ region: 'asia', enabledSources: ['any'] }), [
      provider(
        'any',
        async () => [job({ id: '1', title: 'Remote job' })],
        { regions: ['any'] },
      ),
    ]);
    assert.equal(result.jobs.length, 1);
  });

  it('падение одного провайдера не прячет чужие вакансии', async () => {
    const result = await searchJobs(params({ enabledSources: ['ok', 'fail'] }), [
      provider('ok', async () => [job({ id: '1', title: 'Good job' })]),
      provider('fail', async () => {
        throw new Error('HTTP 500');
      }),
    ]);
    assert.equal(result.jobs.length, 1);
    assert.equal(result.errors.length, 1);
    assert.equal(result.errors[0]?.sourceId, 'fail');
    assert.equal(result.errors[0]?.message, 'сервер источника недоступен');
  });

  it('глотает AbortError и не пишет его в errors', async () => {
    const result = await searchJobs(params({ enabledSources: ['ok', 'abort'] }), [
      provider('ok', async () => [job({ id: '1', title: 'Good job' })]),
      provider('abort', async () => {
        throw Object.assign(new Error('aborted'), { name: 'AbortError' });
      }),
    ]);
    assert.equal(result.jobs.length, 1);
    assert.equal(result.errors.length, 0);
  });

  it('на page > 0 пропускает непровайдеров без пагинации', async () => {
    const called: string[] = [];
    await searchJobs(params({ page: 1, enabledSources: ['page', 'once'] }), [
      provider(
        'page',
        async () => {
          called.push('page');
          return [job({ id: 'p1', title: 'Paged' })];
        },
        { paginated: true },
      ),
      provider('once', async () => {
        called.push('once');
        return [job({ id: 'o1', title: 'Once' })];
      }),
    ]);
    assert.deepEqual(called, ['page']);
  });

  it('отбрасывает вакансии старше 90 дней', async () => {
    const result = await searchJobs(params({ enabledSources: ['a'] }), [
      provider('a', async () => [
        job({ id: 'old', title: 'Old job', publishedAt: old }),
        job({ id: 'new', title: 'New job' }),
      ]),
    ]);
    assert.deepEqual(
      result.jobs.map((item) => item.id),
      ['new'],
    );
  });

  it('оставляет вакансию без даты — ссылка на источник всё равно есть', async () => {
    const result = await searchJobs(params({ enabledSources: ['a'] }), [
      provider('a', async () => [
        job({ id: 'bare', title: 'Bare job', publishedAt: undefined, excerpt: '', company: '' }),
      ]),
    ]);
    assert.equal(result.jobs.length, 1);
    assert.equal(result.jobs[0]?.id, 'bare');
    assert.equal(result.jobs[0]?.url, 'https://example.com');
  });

  it('hasMore=false и exhausted, если страница короче pageSize', async () => {
    const result = await searchJobs(params({ enabledSources: ['page'] }), [
      provider('page', async () => [job({ id: '1', title: 'Only' })], { paginated: true, pageSize: 3 }),
    ]);
    assert.equal(result.hasMore, false);
    assert.deepEqual(result.exhaustedSources, ['page']);
  });

  it('hasMore=true, если paginated отдал полную страницу', async () => {
    const result = await searchJobs(params({ enabledSources: ['page'] }), [
      provider(
        'page',
        async () => [
          job({ id: '1', title: 'A' }),
          job({ id: '2', title: 'B' }),
          job({ id: '3', title: 'C' }),
        ],
        { paginated: true, pageSize: 3 },
      ),
    ]);
    assert.equal(result.hasMore, true);
    assert.deepEqual(result.exhaustedSources, []);
  });

  it('складывает boardTotal из found и дампов', async () => {
    const result = await searchJobs(params({ enabledSources: ['page', 'dump'] }), [
      provider(
        'page',
        async () => ({
          jobs: [job({ id: '1', title: 'A' }), job({ id: '2', title: 'B' }), job({ id: '3', title: 'C' })],
          found: 1200,
        }),
        { paginated: true, pageSize: 3 },
      ),
      provider('dump', async () => [job({ id: 'd1', title: 'Dump 1' }), job({ id: 'd2', title: 'Dump 2' })]),
    ]);
    assert.equal(result.boardTotal, 1200);
    assert.deepEqual(result.boardBySource, { page: 1200 });
  });

  it('без found у дампа не врёт boardTotal длиной страницы', async () => {
    const result = await searchJobs(params({ enabledSources: ['dump'] }), [
      provider('dump', async () => [job({ id: 'd1', title: 'Dump 1' }), job({ id: 'd2', title: 'Dump 2' })]),
    ]);
    assert.equal(result.boardTotal, undefined);
  });

  it('без found у paginated не врёт boardTotal из длины страницы', async () => {
    const result = await searchJobs(params({ enabledSources: ['page'] }), [
      provider(
        'page',
        async () => [job({ id: '1', title: 'A' }), job({ id: '2', title: 'B' }), job({ id: '3', title: 'C' })],
        { paginated: true, pageSize: 3 },
      ),
    ]);
    assert.equal(result.boardTotal, undefined);
  });

  it('на следующей странице не вызывает exhausted-источник', async () => {
    const called: string[] = [];
    await searchJobs(params({ page: 1, enabledSources: ['dead', 'live'], exhaustedSources: ['dead'] }), [
      provider(
        'dead',
        async () => {
          called.push('dead');
          return [job({ id: 'd', title: 'Dead' })];
        },
        { paginated: true, pageSize: 3 },
      ),
      provider(
        'live',
        async () => {
          called.push('live');
          return [job({ id: 'l1', title: 'Live 1' }), job({ id: 'l2', title: 'Live 2' }), job({ id: 'l3', title: 'Live 3' })];
        },
        { paginated: true, pageSize: 3 },
      ),
    ]);
    assert.deepEqual(called, ['live']);
  });

  it('источник без пагинации не даёт hasMore', async () => {
    const result = await searchJobs(params({ enabledSources: ['once'] }), [
      provider('once', async () => [job({ id: '1', title: 'Once' }), job({ id: '2', title: 'Twice' })]),
    ]);
    assert.equal(result.hasMore, false);
    assert.deepEqual(result.exhaustedSources, []);
  });

  it('фильтрует по поисковому запросу', async () => {
    const result = await searchJobs(params({ query: 'python', enabledSources: ['a'] }), [
      provider('a', async () => [
        job({ id: '1', title: 'Python developer' }),
        job({ id: '2', title: 'Java developer' }),
      ]),
    ]);
    assert.deepEqual(
      result.jobs.map((item) => item.id),
      ['1'],
    );
  });

  it('отдаёт быстрый источник, не дожидаясь медленного', async () => {
    const batches: string[] = [];
    let releaseSlow: () => void = () => undefined;
    const slowGate = new Promise<void>((resolve) => {
      releaseSlow = resolve;
    });
    const done = searchJobs(
      params({ enabledSources: ['slow', 'fast'] }),
      [
        provider('slow', async () => {
          await slowGate;
          return [job({ id: 's', title: 'Slow' })];
        }),
        provider('fast', async () => [job({ id: 'f', title: 'Fast' })]),
      ],
      (batch) => batches.push(batch.sourceId),
    );
    await new Promise((resolve) => setTimeout(resolve, 20));
    assert.deepEqual(batches, ['fast']);
    releaseSlow();
    await done;
    assert.deepEqual(batches, ['fast', 'slow']);
  });

  it('дамп-источник стартует после быстрых', async () => {
    const order: string[] = [];
    await searchJobs(params({ region: 'all', enabledSources: ['hh', 'remoteok'] }), [
      provider(
        'hh',
        async () => {
          order.push('hh');
          return [job({ id: 'h', title: 'HH job' })];
        },
        { regions: ['all', 'cis'] },
      ),
      {
        id: 'remoteok',
        regions: ['all'],
        run: async () => {
          order.push('remoteok');
          return [];
        },
      },
    ]);
    assert.deepEqual(order, ['hh', 'remoteok']);
  });

  it('второй одинаковый поиск не дергает провайдеры повторно', async () => {
    let calls = 0;
    const providers = [
      provider('a', async () => {
        calls += 1;
        await new Promise((resolve) => setTimeout(resolve, 20));
        return [job({ id: '1', title: 'Shared' })];
      }),
    ];
    const [first, second] = await Promise.all([
      searchJobs(params({ enabledSources: ['a'] }), providers),
      searchJobs(params({ enabledSources: ['a'] }), providers),
    ]);
    assert.equal(calls, 1);
    assert.equal(first.jobs[0]?.id, '1');
    assert.equal(second.jobs[0]?.id, '1');
  });

  it('аборт одного подписчика не убивает чужой поиск', async () => {
    let calls = 0;
    let release: () => void = () => undefined;
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    const providers = [
      provider('a', async (search) => {
        calls += 1;
        await gate;
        if (search.signal?.aborted) {
          throw Object.assign(new Error('aborted'), { name: 'AbortError' });
        }
        return [job({ id: '1', title: 'Kept' })];
      }),
    ];
    const controller = new AbortController();
    const first = searchJobs(params({ enabledSources: ['a'], signal: controller.signal }), providers);
    const second = searchJobs(params({ enabledSources: ['a'] }), providers);
    await new Promise((resolve) => setTimeout(resolve, 10));
    controller.abort();
    release();
    await assert.rejects(first, (error: unknown) => error instanceof Error && error.name === 'AbortError');
    const result = await second;
    assert.equal(calls, 1);
    assert.equal(result.jobs[0]?.id, '1');
  });

  it('поиск с другим городом не шарит in-flight', async () => {
    const seen: Array<string | undefined> = [];
    const providers = [
      provider('a', async (search) => {
        seen.push(search.placeId);
        return [job({ id: search.placeId ?? 'none', title: search.placeId ?? 'none' })];
      }),
    ];
    const [baku, moscow] = await Promise.all([
      searchJobs(params({ enabledSources: ['a'], placeId: 'baku' }), providers),
      searchJobs(params({ enabledSources: ['a'], placeId: 'moscow' }), providers),
    ]);
    assert.deepEqual(seen.sort(), ['baku', 'moscow']);
    assert.equal(baku.jobs[0]?.id, 'baku');
    assert.equal(moscow.jobs[0]?.id, 'moscow');
  });
});

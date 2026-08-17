import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { jobHref, matchRouteJobId, parseJobIdParam } from './jobRoute';

describe('parseJobIdParam', () => {
  it('склеивает catch-all сегменты url-id', () => {
    assert.equal(
      parseJobIdParam(['jooble:https:', '', 'jooble.org', 'jdp', 'abc']),
      'jooble:https://jooble.org/jdp/abc',
    );
  });

  it('восстанавливает слэш, если пустой сегмент после https: потерялся', () => {
    assert.equal(
      parseJobIdParam(['jooble:https:', 'jooble.org', 'jdp', 'abc']),
      'jooble:https://jooble.org/jdp/abc',
    );
  });

  it('декодирует percent-encoding', () => {
    assert.equal(parseJobIdParam('hh%3A123'), 'hh:123');
    assert.equal(
      parseJobIdParam(encodeURIComponent('jooble:https://jooble.org/jdp/abc')),
      'jooble:https://jooble.org/jdp/abc',
    );
  });

  it('не падает на битом проценте', () => {
    assert.equal(parseJobIdParam('jooble:100%'), 'jooble:100%');
  });
});

describe('matchRouteJobId', () => {
  it('берёт закреплённую вакансию, если путь обрезан по слэшу', () => {
    assert.equal(
      matchRouteJobId('jooble:https:', ['jooble:https://jooble.org/jdp/abc'], 'jooble:https://jooble.org/jdp/abc'),
      'jooble:https://jooble.org/jdp/abc',
    );
  });

  it('не подменяет чужой id', () => {
    assert.equal(matchRouteJobId('hh:99', ['hh:99', 'hh:100'], 'hh:100'), 'hh:99');
  });

  it('находит единственный url-id по обрезанному префиксу', () => {
    assert.equal(
      matchRouteJobId('jooble:https://jooble.org/jdp', ['hh:1', 'jooble:https://jooble.org/jdp/abc']),
      'jooble:https://jooble.org/jdp/abc',
    );
  });
});

describe('jobHref', () => {
  it('ведёт на catch-all, чтобы url-id не резался по слэшам', () => {
    assert.equal(jobHref('jooble:https://jooble.org/jdp/abc').pathname, '/job/[...id]');
  });
});

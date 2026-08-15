import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { makeFeedKey } from './feedKey';

describe('makeFeedKey', () => {
  it('нормализует запрос: trim и lower case', () => {
    assert.equal(makeFeedKey('  React ', 'cis', 'it'), makeFeedKey('react', 'cis', 'it'));
  });

  it('сортирует источники, порядок не важен', () => {
    assert.equal(
      makeFeedKey('', 'cis', 'all', ['hh', 'jooble']),
      makeFeedKey('', 'cis', 'all', ['jooble', 'hh']),
    );
  });

  it('различает регион и категорию', () => {
    assert.notEqual(makeFeedKey('', 'cis', 'all'), makeFeedKey('', 'az', 'all'));
    assert.notEqual(makeFeedKey('', 'cis', 'it'), makeFeedKey('', 'cis', 'all'));
  });
});

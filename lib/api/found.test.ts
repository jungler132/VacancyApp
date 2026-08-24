import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { parseFound } from './found';

describe('parseFound', () => {
  it('читает Jooble totalCount строкой и числом', () => {
    assert.equal(parseFound({ totalCount: 3939044 }), 3939044);
    assert.equal(parseFound({ totalCount: '3939044' }), 3939044);
  });

  it('читает Adzuna count и HH found', () => {
    assert.equal(parseFound({ count: 1200 }), 1200);
    assert.equal(parseFound({ found: 88_000 }), 88000);
  });

  it('игнорирует пустое', () => {
    assert.equal(parseFound({ jobs: [] }), undefined);
    assert.equal(parseFound(null), undefined);
  });
});

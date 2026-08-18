import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { beginNav, isNavLocked, resetNavLock } from './navLock';

describe('navLock', () => {
  it('блокирует повторный переход, пока не истечёт пауза', () => {
    resetNavLock();
    assert.equal(beginNav(), true);
    assert.equal(isNavLocked(), true);
    assert.equal(beginNav(), false);
    resetNavLock();
    assert.equal(beginNav(), true);
    resetNavLock();
  });
});

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { beginNav, hrefKey, isNavLocked, releaseNavLock, resetNavLock } from './navLock';

describe('navLock', () => {
  it('блокирует повторный переход, пока не истечёт пауза', () => {
    resetNavLock();
    assert.equal(beginNav('/a'), true);
    assert.equal(isNavLocked(), true);
    assert.equal(beginNav('/a'), false);
    resetNavLock();
    assert.equal(beginNav('/a'), true);
    resetNavLock();
  });

  it('не пушит тот же экран повторно', () => {
    resetNavLock();
    const first = hrefKey({ pathname: '/service/[id]', params: { id: 'user:1' } });
    const second = hrefKey({ pathname: '/service/[id]', params: { id: 'user:2' } });
    assert.equal(beginNav(first), true);
    releaseNavLock();
    assert.equal(beginNav(first), false);
    assert.equal(beginNav(second), true);
    resetNavLock();
  });
});

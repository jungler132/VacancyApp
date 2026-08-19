import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { appLimits, LIMITS } from './limits';

describe('limits', () => {
  it('free меньше premium, фото профиля одно на обоих планах', () => {
    const free = appLimits(false);
    const premium = appLimits(true);
    assert.equal(free.offers, 10);
    assert.equal(premium.offers, 50);
    assert.equal(free.offerPhotos, 10);
    assert.equal(premium.offerPhotos, 25);
    assert.equal(free.profilePhotos, 1);
    assert.equal(premium.profilePhotos, 1);
    assert.equal(free.jobs, 25);
    assert.equal(premium.jobs, 100);
    assert.equal(free.pipeline, 50);
    assert.equal(premium.pipeline, 250);
    assert.ok(free.offers < LIMITS.premium.offers);
  });
});

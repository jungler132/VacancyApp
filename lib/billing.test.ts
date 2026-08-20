import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { PREMIUM_SKU, purchaseHasPremiumSku } from './billing';

describe('premium sku', () => {
  it('узнаёт свой товар и игнорирует чужой', () => {
    assert.equal(PREMIUM_SKU, 'workly_premium');
    assert.equal(purchaseHasPremiumSku(['workly_premium']), true);
    assert.equal(purchaseHasPremiumSku(['coins']), false);
    assert.equal(purchaseHasPremiumSku([undefined, 'workly_premium']), true);
  });
});

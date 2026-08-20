import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { PREMIUM_SKU, purchaseHasPremiumSku } from './billing';

describe('premium sku', () => {
  it('узнаёт свой товар и игнорирует чужой', () => {
    assert.equal(PREMIUM_SKU, 'vakano_premium');
    assert.equal(purchaseHasPremiumSku(['vakano_premium']), true);
    assert.equal(purchaseHasPremiumSku(['coins']), false);
    assert.equal(purchaseHasPremiumSku([undefined, 'vakano_premium']), true);
  });
});

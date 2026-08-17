import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  INTERSTITIAL_COOLDOWN_MS,
  dismissInterstitial,
  isInterstitialOpen,
  requestInterstitial,
  shouldShowInterstitial,
} from './ads';

describe('interstitial gate', () => {
  it('показывает один раз, потом держит кулдаун', () => {
    dismissInterstitial();
    const t0 = 1_000_000;
    assert.equal(shouldShowInterstitial(t0), true);
    assert.equal(requestInterstitial(t0), true);
    assert.equal(isInterstitialOpen(), true);
    assert.equal(requestInterstitial(t0 + 1_000), false);
    dismissInterstitial();
    assert.equal(isInterstitialOpen(), false);
    assert.equal(shouldShowInterstitial(t0 + INTERSTITIAL_COOLDOWN_MS - 1), false);
    assert.equal(requestInterstitial(t0 + INTERSTITIAL_COOLDOWN_MS), true);
    dismissInterstitial();
  });
});

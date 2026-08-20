import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  INTERSTITIAL_COOLDOWN_MS,
  INTERSTITIAL_EVERY_N,
  adsUseTestUnits,
  bannerUnitId,
  canShowInterstitial,
  interstitialUnitId,
  markInterstitialShown,
  noteEligibleOpen,
  resetAdsGate,
} from './ads';

describe('interstitial gate', () => {
  it('пускает каждое N-е открытие и держит кулдаун после показа', () => {
    resetAdsGate();
    for (let i = 1; i < INTERSTITIAL_EVERY_N; i += 1) {
      assert.equal(noteEligibleOpen(), false);
    }
    assert.equal(noteEligibleOpen(), true);
    assert.equal(canShowInterstitial(1_000_000), true);
    markInterstitialShown(1_000_000);
    assert.equal(canShowInterstitial(1_000_000 + INTERSTITIAL_COOLDOWN_MS - 1), false);
    assert.equal(canShowInterstitial(1_000_000 + INTERSTITIAL_COOLDOWN_MS), true);
  });

  it('в тестовом режиме отдаёт demo unit Google', () => {
    assert.equal(adsUseTestUnits(), true);
    assert.match(interstitialUnitId(), /3940256099942544/);
    assert.match(bannerUnitId(), /3940256099942544/);
  });
});

export const INTERSTITIAL_COOLDOWN_MS = 90_000;
export const INTERSTITIAL_EVERY_N = 3;

export const AD_KEYWORDS = ['jobs', 'career', 'employment', 'vacancy', 'hiring'];

const TEST_INTERSTITIAL = 'ca-app-pub-3940256099942544/1033173712';
const TEST_BANNER = 'ca-app-pub-3940256099942544/6300978111';

let lastShownAt = 0;
let opens = 0;
const listeners = new Set<() => void>();

export function subscribeInterstitialRequest(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Ask the ads host to show a full-screen ad if a slot is available. */
export function requestInterstitial() {
  for (const listener of listeners) listener();
}

export function canShowInterstitial(now = Date.now()): boolean {
  return now - lastShownAt >= INTERSTITIAL_COOLDOWN_MS;
}

/** Count a content open. True on every Nth open (then the host may show an ad). */
export function noteEligibleOpen(): boolean {
  opens += 1;
  return opens % INTERSTITIAL_EVERY_N === 0;
}

export function markInterstitialShown(now = Date.now()) {
  lastShownAt = now;
}

export function resetAdsGate() {
  lastShownAt = 0;
  opens = 0;
}

/** Debug always uses Google demo units. Release uses them until EXPO_PUBLIC_ADMOB_USE_TEST_ADS=0. */
export function adsUseTestUnits(): boolean {
  if (typeof __DEV__ !== 'undefined' && __DEV__) return true;
  const flag = (process.env.EXPO_PUBLIC_ADMOB_USE_TEST_ADS ?? '1').trim().toLowerCase();
  return flag !== '0' && flag !== 'false';
}

export function interstitialUnitId(): string {
  if (adsUseTestUnits()) return TEST_INTERSTITIAL;
  return process.env.EXPO_PUBLIC_ADMOB_INTERSTITIAL_ID || TEST_INTERSTITIAL;
}

export function bannerUnitId(): string {
  if (adsUseTestUnits()) return TEST_BANNER;
  return process.env.EXPO_PUBLIC_ADMOB_BANNER_ID || TEST_BANNER;
}

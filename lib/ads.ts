export const INTERSTITIAL_COOLDOWN_MS = 90_000;
export const INTERSTITIAL_SKIP_AFTER_SEC = 3;

let lastShownAt = 0;
let visible = false;
const listeners = new Set<(open: boolean) => void>();

function emit() {
  for (const listener of listeners) listener(visible);
}

export function subscribeInterstitial(listener: (open: boolean) => void): () => void {
  listeners.add(listener);
  listener(visible);
  return () => {
    listeners.delete(listener);
  };
}

export function isInterstitialOpen(): boolean {
  return visible;
}

export function shouldShowInterstitial(now = Date.now()): boolean {
  if (visible) return false;
  return now - lastShownAt >= INTERSTITIAL_COOLDOWN_MS;
}

export function requestInterstitial(now = Date.now()): boolean {
  if (!shouldShowInterstitial(now)) return false;
  lastShownAt = now;
  visible = true;
  emit();
  return true;
}

export function dismissInterstitial() {
  if (!visible) return;
  visible = false;
  emit();
}

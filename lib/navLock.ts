const LOCK_MS = 1600;
const SAME_MS = 2500;
let locked = false;
let lastKey = '';
let lastAt = 0;
let timer: ReturnType<typeof setTimeout> | null = null;

export function hrefKey(href: unknown): string {
  if (typeof href === 'string') return href;
  try {
    return JSON.stringify(href);
  } catch {
    return String(href);
  }
}

export function beginNav(key?: string): boolean {
  const now = Date.now();
  if (locked) return false;
  if (key && key === lastKey && now - lastAt < SAME_MS) return false;
  locked = true;
  if (key) {
    lastKey = key;
    lastAt = now;
  }
  if (timer) clearTimeout(timer);
  timer = setTimeout(() => {
    locked = false;
    timer = null;
  }, LOCK_MS);
  return true;
}

export function resetNavLock(): void {
  if (timer) clearTimeout(timer);
  timer = null;
  locked = false;
  lastKey = '';
  lastAt = 0;
}

export function releaseNavLock(): void {
  if (timer) clearTimeout(timer);
  timer = null;
  locked = false;
}

export function isNavLocked(): boolean {
  return locked;
}

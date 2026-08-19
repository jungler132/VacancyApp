const LOCK_MS = 800;
let locked = false;
let timer: ReturnType<typeof setTimeout> | null = null;

export function beginNav(): boolean {
  if (locked) return false;
  locked = true;
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
}

export function isNavLocked(): boolean {
  return locked;
}

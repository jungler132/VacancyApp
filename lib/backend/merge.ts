function stamp(value?: string): number {
  const time = Date.parse(value ?? '');
  return Number.isFinite(time) ? time : 0;
}

export function pickNewer<T extends { updatedAt?: string; publishedAt?: string }>(local: T | null, remote: T | null): T | null {
  if (!local) return remote;
  if (!remote) return local;
  const localAt = stamp(local.updatedAt ?? local.publishedAt);
  const remoteAt = stamp(remote.updatedAt ?? remote.publishedAt);
  return remoteAt > localAt ? remote : local;
}

export function mergeById<T extends { id: string; updatedAt?: string; publishedAt?: string }>(local: T[], remote: T[]): T[] {
  const map = new Map<string, T>();
  for (const item of local) map.set(item.id, item);
  for (const item of remote) {
    const prev = map.get(item.id);
    map.set(item.id, pickNewer(prev ?? null, item) ?? item);
  }
  return [...map.values()];
}

export function isRemoteUri(uri: string): boolean {
  return /^https?:\/\//i.test(uri);
}

export function keepRemoteUrl(next?: string, prev?: string): string | undefined {
  if (next && isRemoteUri(next)) return next;
  if (prev && isRemoteUri(prev)) return prev;
  return undefined;
}

/** Prefer a public URL; otherwise keep the local file so the next sync can upload it. */
export function preferMediaUri(remote?: string, local?: string): string | undefined {
  if (remote && isRemoteUri(remote)) return remote;
  if (local) return local;
  return remote || undefined;
}

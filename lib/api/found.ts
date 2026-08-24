const FOUND_KEYS = ['totalCount', 'TotalCount', 'total_count', 'found', 'count', 'total'] as const;

export function parseFound(data: unknown): number | undefined {
  if (!data || typeof data !== 'object') return undefined;
  const rec = data as Record<string, unknown>;
  for (const key of FOUND_KEYS) {
    const n = Number(rec[key]);
    if (Number.isFinite(n) && n > 0) return Math.round(n);
  }
  return undefined;
}

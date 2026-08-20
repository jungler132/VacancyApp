const TAG = '[vakano:feed]';

export function feedLog(event: string, extra: Record<string, unknown> = {}) {
  const errors = Number(extra.errors ?? 0);
  const keep = event === 'source:fail' || (event === 'search:done' && errors > 0);
  if (!keep) return;
  const parts = [TAG, event];
  for (const [key, value] of Object.entries(extra)) {
    if (value === undefined || value === '') continue;
    parts.push(`${key}=${Array.isArray(value) ? value.join(',') : String(value)}`);
  }
  console.log(parts.join(' '));
}

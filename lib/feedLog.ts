const TAG = '[workly:feed]';

export function feedLog(event: string, extra: Record<string, unknown> = {}) {
  const parts = [TAG, event];
  for (const [key, value] of Object.entries(extra)) {
    if (value === undefined || value === '') continue;
    parts.push(`${key}=${Array.isArray(value) ? value.join(',') : String(value)}`);
  }
  console.log(parts.join(' '));
}

const JOB_BOARD_HOST =
  /arbeitnow\.com|hh\.(ru|az)|headhunter|remotive\.com|remoteok\.com|jobicy\.com|himalayas\.app|adzuna\.|jooble\.org|trudvsem\.ru|birjob\.com|usajobs\.gov|workly|greenhouse\.io|lever\.co|workable\.com|smartrecruiters\.com|ashbyhq\.com|myworkdayjobs\.com|icims\.com|jobvite\.com|breezy\.hr|recruitee\.com|personio\.|join\.com|comeet\.com|taleo\.net/i;

export function normalizeLogoUrl(value?: string | null): string | undefined {
  const raw = String(value ?? '').trim();
  if (!raw || raw.length > 800) return undefined;
  if (raw.startsWith('data:image/')) return raw;
  if (/^(file|content):\/\//i.test(raw)) return raw;
  const url = raw.startsWith('//') ? `https:${raw}` : raw.startsWith('http://') ? `https://${raw.slice(7)}` : raw;
  if (!/^https:\/\//i.test(url)) return undefined;
  return url;
}

export function logoFromApplyUrl(url?: string | null): string | undefined {
  const href = String(url ?? '').trim();
  if (!href) return undefined;
  try {
    const host = new URL(href).hostname.replace(/^www\./, '');
    if (!host || JOB_BOARD_HOST.test(host)) return undefined;
    return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(host)}&sz=128`;
  } catch {
    return undefined;
  }
}

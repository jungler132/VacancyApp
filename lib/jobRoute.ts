export function parseJobIdParam(raw: string | string[] | undefined): string {
  const joined = Array.isArray(raw) ? raw.filter((part) => part != null).join('/') : String(raw ?? '');
  if (!joined) return '';
  let value = joined;
  for (let i = 0; i < 2; i += 1) {
    if (!/%[0-9A-Fa-f]{2}/.test(value)) break;
    try {
      value = decodeURIComponent(value);
    } catch {
      break;
    }
  }
  return value.replace(/(https?:)\/(?!\/)/gi, '$1//');
}

function isTruncatedUrlId(decoded: string, full: string): boolean {
  return decoded.length >= 8 && /https?:/i.test(decoded) && full.startsWith(decoded);
}

export function matchRouteJobId(decoded: string, knownIds: Iterable<string>, viewedId?: string): string {
  if (viewedId && (!decoded || viewedId === decoded || isTruncatedUrlId(decoded, viewedId))) return viewedId;
  if (!decoded) return viewedId ?? '';
  for (const id of knownIds) {
    if (id === decoded) return id;
  }
  if (decoded.length < 12 || !/https?:/i.test(decoded)) return decoded;
  const hits: string[] = [];
  for (const id of knownIds) {
    if (id.startsWith(decoded)) hits.push(id);
  }
  return hits.length === 1 ? hits[0] : decoded;
}

export function jobHref(id: string) {
  return {
    pathname: '/job/[...id]' as const,
    params: { id: [id] },
  };
}

export type HhSalary = { from?: number | null; to?: number | null; currency?: string | null };

export type HhVacancy = {
  id: string;
  name: string;
  employer?: { name?: string };
  area?: { name?: string };
  salary?: HhSalary | null;
  published_at?: string;
  alternate_url?: string;
  snippet?: { requirement?: string; responsibility?: string };
  schedule?: { name?: string };
  employment?: { name?: string };
  experience?: { name?: string };
  description?: string;
};

function decodeXml(value: string): string {
  return value
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'");
}

function tag(xml: string, name: string): string {
  const match = xml.match(new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)</${name}>`, 'i'));
  return match ? decodeXml(match[1]).trim() : '';
}

function stripTags(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/[^\S\n]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function field(block: string, label: string): string {
  const match = block.match(new RegExp(`${label}:\\s*([^<\\n]+)`, 'i'));
  return match?.[1]?.replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim() ?? '';
}

function digits(raw: string): number | null {
  const n = Number(raw.replace(/[^\d]/g, ''));
  return Number.isFinite(n) && n > 0 ? n : null;
}

export function parseSalaryText(raw: string): HhSalary | null {
  const text = raw.replace(/\u00a0/g, ' ').replace(/\s+/g, ' ').trim();
  if (!text || /не указан/i.test(text)) return null;
  const range = text.match(/(\d[\d\s]*)\s*[-–—]\s*(\d[\d\s]*)/);
  const single = text.match(/(\d[\d\s]{2,})/);
  const from = digits(range?.[1] ?? single?.[1] ?? '');
  const to = digits(range?.[2] ?? '');
  if (!from && !to) return null;
  let currency: string | null = null;
  if (/₽|руб|RUB|RUR/i.test(text)) currency = 'RUB';
  else if (/₼|AZN|манат/i.test(text)) currency = 'AZN';
  else if (/₸|тенге|KZT/i.test(text)) currency = 'KZT';
  else if (/\$|USD/i.test(text)) currency = 'USD';
  else if (/€|EUR/i.test(text)) currency = 'EUR';
  return { from, to: to && to !== from ? to : null, currency };
}

function toIso(value: string): string | undefined {
  const ms = Date.parse(value);
  return Number.isFinite(ms) ? new Date(ms).toISOString() : undefined;
}

export function rssItemToVacancy(itemXml: string): HhVacancy | null {
  const link = tag(itemXml, 'link') || tag(itemXml, 'guid');
  const id = link.match(/vacancy\/(\d+)/)?.[1];
  const name = tag(itemXml, 'title');
  if (!id || !name) return null;
  const description = tag(itemXml, 'description');
  const company = field(description, 'Вакансия компании') || field(description, 'Company');
  const region = field(description, 'Регион') || field(description, 'Region');
  const salary = parseSalaryText(
    field(description, 'Предполагаемый уровень месячного дохода') ||
      field(description, 'Compensation') ||
      '',
  );
  const snippet = stripTags(description);
  return {
    id,
    name,
    employer: { name: company || undefined },
    area: { name: region || undefined },
    salary,
    published_at: toIso(tag(itemXml, 'pubDate')),
    alternate_url: `https://hh.ru/vacancy/${id}`,
    snippet: snippet ? { responsibility: snippet } : undefined,
  };
}

export function parseHhRss(xml: string): HhVacancy[] {
  const items = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/gi)].map((match) => match[1]);
  const out: HhVacancy[] = [];
  const seen = new Set<string>();
  for (const item of items) {
    const vacancy = rssItemToVacancy(item);
    if (!vacancy || seen.has(vacancy.id)) continue;
    seen.add(vacancy.id);
    out.push(vacancy);
  }
  return out;
}

export function innerByQa(html: string, qa: string): string {
  const open = html.match(new RegExp(`<(div|span|h1|h2)[^>]*data-qa="${qa}"[^>]*>`, 'i'));
  if (!open || open.index == null) return '';
  const tagName = open[1].toLowerCase();
  let i = open.index + open[0].length;
  let depth = 1;
  while (i < html.length && depth > 0) {
    const nextOpen = html.toLowerCase().indexOf(`<${tagName}`, i);
    const nextClose = html.toLowerCase().indexOf(`</${tagName}`, i);
    if (nextClose < 0) break;
    if (nextOpen >= 0 && nextOpen < nextClose) {
      depth += 1;
      i = nextOpen + tagName.length + 1;
      continue;
    }
    depth -= 1;
    if (depth === 0) return html.slice(open.index + open[0].length, nextClose).trim();
    i = nextClose + tagName.length + 3;
  }
  return html.slice(open.index + open[0].length, open.index + open[0].length + 8000);
}

export function parseVacancyHtml(id: string, html: string): Record<string, unknown> {
  const description = innerByQa(html, 'vacancy-description');
  const name = stripTags(innerByQa(html, 'vacancy-title') || innerByQa(html, 'vacancy-name'));
  const company = stripTags(innerByQa(html, 'vacancy-company-name') || innerByQa(html, 'vacancy-company-name-wrapper'));
  const location = stripTags(
    innerByQa(html, 'vacancy-view-raw-address') ||
      innerByQa(html, 'vacancy-view-location') ||
      innerByQa(html, 'vacancy-view-location-label'),
  );
  const salaryText = stripTags(innerByQa(html, 'vacancy-salary') || innerByQa(html, 'vacancy-salary-compensation-type-net'));
  return {
    id,
    name: name || undefined,
    description: description || undefined,
    employer: company ? { name: company } : undefined,
    area: location ? { name: location } : undefined,
    salary: parseSalaryText(salaryText),
    alternate_url: `https://hh.ru/vacancy/${id}`,
  };
}

export function rssSearchUrl(params: URLSearchParams): string {
  const rss = new URL('https://hh.ru/search/vacancy/rss');
  const text = params.get('text');
  if (text) rss.searchParams.set('text', text);
  rss.searchParams.set('items_on_page', params.get('per_page') || '20');
  rss.searchParams.set('page', params.get('page') || '0');
  rss.searchParams.set('order_by', params.get('order_by') || 'publication_time');
  const areas = params.getAll('area');
  if (areas.length) for (const area of areas) rss.searchParams.append('area', area);
  else rss.searchParams.append('area', '113');
  return rss.toString();
}

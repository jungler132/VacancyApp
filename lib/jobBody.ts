import { htmlToText } from './format';

export type JobBodyBlock =
  | { type: 'heading'; text: string }
  | { type: 'paragraph'; text: string }
  | { type: 'list'; items: string[] };

const HEADING_PHRASES = [
  'what we offer you',
  'what we offer',
  'what you will do',
  "what you'll do",
  'what you do',
  'what you bring',
  'who we are looking for',
  'who we are',
  'who you are',
  'company overview',
  'about the company',
  'about the role',
  'about the job',
  'about the team',
  'about us',
  'about you',
  'job description',
  'job summary',
  'key responsibilities',
  'your responsibilities',
  'your profile',
  'your tasks',
  'your role',
  'how to apply',
  'must-have',
  'must have',
  'nice-to-have',
  'nice to have',
  'we offer',
  'our offer',
  'our benefits',
  'equal opportunity',
  'responsibilities',
  'requirements',
  'qualifications',
  'benefits',
  'profile',
  'skills',
  'tasks',
  'mission',
  'обязанности',
  'требования',
  'условия работы',
  'условия',
  'о компании',
  'о проекте',
  'о команде',
  'о нас',
  'о вас',
  'мы предлагаем',
  'что мы предлагаем',
  'чем предстоит заниматься',
  'что нужно делать',
  'ключевые задачи',
  'будет плюсом',
  'мы ждём',
  'мы ждем',
  'ожидания',
  'задачи',
  'описание вакансии',
  'описание',
  'необходимо',
  'tələblər',
  'vəzifələr',
  'şərtlər',
  'haqqımızda',
].sort((a, b) => b.length - a.length);

const HEADING_RE = new RegExp(
  `(^|[^\\p{L}\\p{N}])(${HEADING_PHRASES.map(escapeRegExp).join('|')})\\s*:`,
  'giu',
);

const HEADING_LINE_RE = new RegExp(
  `^(${HEADING_PHRASES.map(escapeRegExp).join('|')})(?:\\s*:\\s*(.*)|\\s*)$`,
  'iu',
);

const LIST_HEADING =
  /responsibilit|requirement|offer|benefit|qualif|skill|task|обязан|требован|услови|задач|плюс|ожидан|необходим|tələb|vəzif|şərt|must|nice to have|what you/i;

export function parseJobBody(raw?: string | null): JobBodyBlock[] {
  const prepared = breakKnownHeadings(normalizeMarkup(htmlToText(raw)));
  if (!prepared) return [];

  const lines = prepared
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean);

  const blocks: JobBodyBlock[] = [];
  let heading: string | null = null;
  let buffer: string[] = [];

  const flush = () => {
    const body = buffer.join('\n').trim();
    buffer = [];
    if (heading) {
      blocks.push({ type: 'heading', text: heading });
    }
    if (body) blocks.push(...bodyBlocks(body, heading));
    heading = null;
  };

  for (const line of lines) {
    const found = lineHeading(line);
    if (found) {
      flush();
      heading = found.title;
      if (found.rest) buffer.push(found.rest);
      continue;
    }
    buffer.push(line);
  }
  flush();

  return mergeShortParagraphs(blocks);
}

export function jobBodyPlain(raw?: string | null): string {
  return parseJobBody(raw)
    .map((block) => {
      if (block.type === 'heading') return `${block.text}:`;
      if (block.type === 'list') return block.items.map((item) => `• ${item}`).join('\n');
      return block.text;
    })
    .join('\n\n');
}

function normalizeMarkup(text: string): string {
  return text
    .replace(/^#{1,3}\s+/gm, '')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/^\s*[-*+]\s+/gm, '• ')
    .replace(/^\s*\d+[.)]\s+/gm, '• ')
    .trim();
}

function breakKnownHeadings(text: string): string {
  return text.replace(HEADING_RE, (full, prefix: string, heading: string) => {
    const lead = !prefix || prefix === '\n' ? prefix : `${prefix.replace(/\s+$/, '')}\n\n`;
    return `${lead}${heading.trim()}:\n`;
  });
}

function lineHeading(line: string): { title: string; rest: string } | null {
  const text = line.replace(/^•\s*/, '').trim();
  const known = text.match(HEADING_LINE_RE);
  if (known) {
    return { title: tidyHeading(known[1]), rest: (known[2] ?? '').trim() };
  }

  const generic = text.match(/^([\p{L}][^.]{1,42}?)\s*:\s*(.*)$/u);
  if (!generic) return null;
  const title = tidyHeading(generic[1]);
  const rest = generic[2].trim();
  if (!title || /\d{1,2}:\d{2}/.test(title)) return null;
  const words = title.split(/\s+/);
  if (words.length > 6) return null;
  if (!rest) return { title, rest: '' };
  if (LIST_HEADING.test(title) || words.length <= 3) return { title, rest };
  return null;
}

function bodyBlocks(body: string, heading: string | null): JobBodyBlock[] {
  const items = splitListItems(body, heading);
  if (items.length >= 2) return [{ type: 'list', items }];
  return paragraphsOf(body).map((text) => ({ type: 'paragraph' as const, text }));
}

function splitListItems(body: string, heading: string | null): string[] {
  const lines = body.split(/\n/).map((line) => line.trim()).filter(Boolean);
  const bulletLines = lines.filter((line) => /^[•\-–—*·]/.test(line));
  if (bulletLines.length >= 2 || (bulletLines.length === 1 && lines.length === 1 && heading && LIST_HEADING.test(heading))) {
    const items = lines.map(stripItemPrefix).filter((item) => item.length > 1);
    if (items.length >= 2) return items;
  }

  const joined = lines.join(' ');
  if (/(?:^|\s)\d+[.)]\s+\S/.test(joined) && (joined.match(/\d+[.)]\s+/g)?.length ?? 0) >= 2) {
    const items = joined
      .split(/(?:^|\s+)\d+[.)]\s+/)
      .map(stripItemPrefix)
      .filter((item) => item.length > 1);
    if (items.length >= 2) return items;
  }

  if ((joined.match(/•/g)?.length ?? 0) >= 2) {
    const items = joined.split(/\s*•\s*/).map(stripItemPrefix).filter((item) => item.length > 1);
    if (items.length >= 2) return items;
  }

  const listSection = Boolean(heading && LIST_HEADING.test(heading));
  if (listSection) {
    const runOn = splitRunOnItems(joined);
    if (runOn.length >= 2) return runOn;
    const sentences = splitSentences(joined).filter((item) => item.length > 1);
    if (sentences.length >= 3 && sentences.every((item) => item.length < 220)) return sentences;
  }

  if (lines.length >= 3 && lines.every((line) => line.length < 160) && listSection) {
    return lines.map(stripItemPrefix);
  }

  return [];
}

function splitRunOnItems(text: string): string[] {
  const parts = text
    .split(/(?<=[\p{Ll}\p{N})\]])\s+(?=[\p{Lu}][\p{Ll}]{2,})/u)
    .map(stripItemPrefix)
    .filter((item) => item.length > 8);
  if (parts.length < 2) return [];
  const merged: string[] = [];
  for (const part of parts) {
    const prev = merged[merged.length - 1];
    if (prev && (part.length < 18 || /^(and|or|including|with|for|in|of|to|и|или|в|на|для)\b/i.test(part))) {
      merged[merged.length - 1] = `${prev} ${part}`;
    } else {
      merged.push(part);
    }
  }
  return merged.length >= 2 ? merged : [];
}

function paragraphsOf(text: string): string[] {
  const chunks = text
    .split(/\n{2,}/)
    .map((part) => part.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim())
    .filter(Boolean);
  const source = chunks.length > 1 ? chunks : [text.replace(/\s+/g, ' ').trim()].filter(Boolean);
  const out: string[] = [];
  for (const chunk of source) {
    if (chunk.length <= 280) {
      out.push(chunk);
      continue;
    }
    const sentences = splitSentences(chunk);
    let buffer = '';
    for (const sentence of sentences) {
      buffer = buffer ? `${buffer} ${sentence}` : sentence;
      if (buffer.length > 220) {
        out.push(buffer);
        buffer = '';
      }
    }
    if (buffer) out.push(buffer);
  }
  return out.length ? out : source;
}

function splitSentences(text: string): string[] {
  const sentences: string[] = [];
  let rest = text.trim();
  while (rest.length) {
    const match = rest.match(/^[\s\S]{8,}?[.!?](?=\s+[^\s]|$)/);
    if (!match) {
      if (rest.trim()) sentences.push(rest.trim());
      break;
    }
    sentences.push(match[0].trim());
    rest = rest.slice(match[0].length).trim();
  }
  return sentences;
}

function mergeShortParagraphs(blocks: JobBodyBlock[]): JobBodyBlock[] {
  const out: JobBodyBlock[] = [];
  for (const block of blocks) {
    const prev = out[out.length - 1];
    if (block.type === 'paragraph' && prev?.type === 'paragraph' && prev.text.length < 90 && block.text.length < 140) {
      prev.text = `${prev.text} ${block.text}`;
      continue;
    }
    out.push(block.type === 'list' ? { type: 'list', items: [...block.items] } : { ...block });
  }
  return out;
}

function stripItemPrefix(value: string): string {
  return value
    .replace(/^[•\-–—*·]\s+/, '')
    .replace(/^\d+[.)]\s+/, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function tidyHeading(value: string): string {
  const text = value.replace(/\s+/g, ' ').replace(/:+$/, '').trim();
  if (!text) return '';
  return text.replace(/^[\p{Ll}]/u, (char) => char.toLocaleUpperCase());
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

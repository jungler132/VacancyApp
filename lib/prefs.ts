import { jobMatchesAnyLang } from '@/lib/catalog';
import { DEFAULT_EXTRA_FILTERS, type ExtraFilters, type WorkFormat } from '@/lib/filters';
import type { CategoryId, Job, RegionId } from '@/lib/types';

export const TITLE_MAX = 80;

const FORMATS: WorkFormat[] = ['any', 'remote', 'office'];

export type SeekPrefs = {
  title: string;
  format: WorkFormat;
};

export const DEFAULT_SEEK_PREFS: SeekPrefs = {
  title: '',
  format: 'any',
};

export function parseFormat(value: unknown): WorkFormat {
  return FORMATS.includes(value as WorkFormat) ? (value as WorkFormat) : 'any';
}

export function parseSeekPrefs(raw: unknown): SeekPrefs {
  const row = raw && typeof raw === 'object' ? (raw as Partial<SeekPrefs>) : {};
  const title = typeof row.title === 'string' ? row.title.trim().slice(0, TITLE_MAX) : '';
  return { title, format: parseFormat(row.format) };
}

export function prefsFilled(prefs: SeekPrefs): boolean {
  return Boolean(prefs.title.trim() || prefs.format !== 'any');
}

export function jobMatchesPrefs(job: Job, prefs: SeekPrefs): boolean {
  if (prefs.format === 'remote' && !job.remote) return false;
  if (prefs.format === 'office' && job.remote) return false;
  const title = prefs.title.trim();
  if (title) {
    const hay = `${job.title} ${job.company} ${job.excerpt} ${job.category ?? ''}`;
    if (!jobMatchesAnyLang(hay, title)) return false;
  }
  return true;
}

export function searchFromPrefs(prefs: SeekPrefs): {
  query: string;
  region: RegionId;
  categories: CategoryId[];
  extra: ExtraFilters;
} {
  return {
    query: prefs.title.trim(),
    region: prefs.format === 'remote' ? 'remote' : 'all',
    categories: ['all'],
    extra: { ...DEFAULT_EXTRA_FILTERS, format: prefs.format },
  };
}

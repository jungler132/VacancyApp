import type { ServiceHours, WeekdayId } from './types';

export const WEEKDAYS: WeekdayId[] = [1, 2, 3, 4, 5, 6, 7];
export const WORKDAYS: WeekdayId[] = [1, 2, 3, 4, 5];

export const HOUR_VALUES = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
export const MINUTE_VALUES = Array.from({ length: 12 }, (_, i) => String(i * 5).padStart(2, '0'));

export const DEFAULT_HOURS: ServiceHours = { open: '09:00', close: '18:00', days: [...WORKDAYS] };

export function isWeekdayId(value: unknown): value is WeekdayId {
  return typeof value === 'number' && Number.isInteger(value) && value >= 1 && value <= 7;
}

export function parseWeekdays(raw: unknown, fallback: WeekdayId[] = WEEKDAYS): WeekdayId[] {
  if (!Array.isArray(raw)) return [...fallback];
  const seen = new Set<WeekdayId>();
  const out: WeekdayId[] = [];
  for (const item of raw) {
    const n = typeof item === 'string' ? Number(item) : item;
    if (!isWeekdayId(n) || seen.has(n)) continue;
    seen.add(n);
    out.push(n);
  }
  return out.sort((a, b) => a - b);
}

export function parseClock(value: string, fallback = '09:00'): { hour: string; minute: string; clock: string } {
  const match = /^(\d{1,2}):(\d{2})$/.exec(value.trim()) ?? /^(\d{1,2}):(\d{2})$/.exec(fallback);
  let hourNum = Math.min(23, Math.max(0, Number(match?.[1] ?? 9)));
  const minuteNum = Math.min(59, Math.max(0, Number(match?.[2] ?? 0)));
  let snapped = Math.round(minuteNum / 5) * 5;
  if (snapped >= 60) {
    snapped = 0;
    hourNum = (hourNum + 1) % 24;
  }
  const hour = String(hourNum).padStart(2, '0');
  const minute = String(snapped).padStart(2, '0');
  return { hour, minute, clock: `${hour}:${minute}` };
}

export function normalizeClock(value: unknown, fallback = '09:00'): string {
  return parseClock(typeof value === 'string' ? value : '', fallback).clock;
}

export function composeClock(hour: string, minute: string): string {
  return parseClock(`${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`).clock;
}

export function formatServiceHours(open?: string, close?: string): string {
  const from = open?.trim();
  const to = close?.trim();
  if (!from && !to) return '';
  if (from && to) return `${from}–${to}`;
  return from || to || '';
}

export function formatWeekdays(
  days: number[] | undefined,
  labelOf: (id: WeekdayId) => string,
  allLabel = '',
): string {
  const uniq = [...new Set((days ?? []).filter(isWeekdayId))].sort((a, b) => a - b);
  if (!uniq.length) return '';
  if (uniq.length === 7) return allLabel;
  const parts: string[] = [];
  let start = uniq[0]!;
  let prev = start;
  const flush = () => {
    if (start === prev) parts.push(labelOf(start));
    else parts.push(`${labelOf(start)}–${labelOf(prev)}`);
  };
  for (const day of uniq.slice(1)) {
    if (day === prev + 1) {
      prev = day;
      continue;
    }
    flush();
    start = prev = day;
  }
  flush();
  return parts.join(', ');
}

export function formatServiceSchedule(
  hours: Pick<ServiceHours, 'open' | 'close' | 'days'> | undefined,
  dayLabel: (id: WeekdayId) => string,
  allLabel = '',
): string {
  if (!hours) return '';
  const days = formatWeekdays(hours.days, dayLabel, allLabel);
  const time = formatServiceHours(hours.open, hours.close);
  return [days, time].filter(Boolean).join(' · ');
}

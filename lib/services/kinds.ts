import type { ServiceKindId } from './types';

export const SERVICE_KINDS: { id: ServiceKindId; label: string; icon: string }[] = [
  { id: 'cleaning', label: 'Уборка', icon: 'broom' },
  { id: 'beauty', label: 'Красота', icon: 'content-cut' },
  { id: 'repair', label: 'Ремонт', icon: 'hammer-wrench' },
  { id: 'tutoring', label: 'Репетитор', icon: 'school-outline' },
  { id: 'photo', label: 'Фото', icon: 'camera-outline' },
  { id: 'delivery', label: 'Доставка', icon: 'moped' },
  { id: 'pets', label: 'Животные', icon: 'paw' },
  { id: 'it_help', label: 'IT-помощь', icon: 'laptop' },
  { id: 'events', label: 'Мероприятия', icon: 'party-popper' },
  { id: 'other', label: 'Другое', icon: 'dots-horizontal' },
];

export const SERVICE_KIND_FILTERS: { id: ServiceKindId | 'all'; label: string; icon?: string }[] = [
  { id: 'all', label: 'Все' },
  ...SERVICE_KINDS.map((item) => ({ id: item.id, label: item.label, icon: item.icon })),
];

const KIND_SET = new Set<string>(SERVICE_KINDS.map((item) => item.id));

export function isServiceKindId(value: unknown): value is ServiceKindId {
  return typeof value === 'string' && KIND_SET.has(value);
}

export function serviceKindLabel(id: ServiceKindId): string {
  return SERVICE_KINDS.find((item) => item.id === id)?.label ?? id;
}

export function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '?';
  const first = parts[0]?.[0] ?? '';
  const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? '') : (parts[0]?.[1] ?? '');
  return `${first}${last}`.toUpperCase();
}

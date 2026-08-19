export type ApplyStatus = 'applied' | 'review' | 'interview' | 'test' | 'offer' | 'rejected';

export const APPLY_STATUSES: { id: ApplyStatus; label: string }[] = [
  { id: 'applied', label: 'Откликнулся' },
  { id: 'review', label: 'На рассмотрении' },
  { id: 'interview', label: 'Интервью' },
  { id: 'test', label: 'Тестовое' },
  { id: 'offer', label: 'Оффер' },
  { id: 'rejected', label: 'Отказ' },
];

const APPLY_SET = new Set<string>(APPLY_STATUSES.map((item) => item.id));
const LIVE_ORDER: ApplyStatus[] = ['applied', 'review', 'interview', 'test', 'offer'];
export const REPLIED_STATUSES: ApplyStatus[] = ['review', 'interview', 'test', 'offer'];

export function isApplyStatus(value: unknown): value is ApplyStatus {
  return typeof value === 'string' && APPLY_SET.has(value);
}

export function applyStatusLabel(status?: ApplyStatus | null): string | null {
  if (!status) return null;
  return APPLY_STATUSES.find((item) => item.id === status)?.label ?? null;
}

export function nextApplyStatus(status: ApplyStatus): ApplyStatus | null {
  const index = LIVE_ORDER.indexOf(status);
  if (index < 0 || index >= LIVE_ORDER.length - 1) return null;
  return LIVE_ORDER[index + 1] ?? null;
}

export type ApplyStatus = 'applied' | 'review' | 'rejected';

export const APPLY_STATUSES: { id: ApplyStatus; label: string }[] = [
  { id: 'applied', label: 'Откликнулся' },
  { id: 'review', label: 'На рассмотрении' },
  { id: 'rejected', label: 'Отказ' },
];

export function applyStatusLabel(status?: ApplyStatus | null): string | null {
  if (!status) return null;
  return APPLY_STATUSES.find((item) => item.id === status)?.label ?? null;
}

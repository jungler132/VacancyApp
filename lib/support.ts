export const SUPPORT_EMAIL = 'worklysupport@proton.me';
export const REPORT_MAX = 120;
export const REPORT_COOLDOWN_MS = 24 * 60 * 60 * 1000;

export function reportUnlockAt(lastAt: number | null | undefined, now = Date.now()): number | null {
  if (lastAt == null || !Number.isFinite(lastAt)) return null;
  const unlock = lastAt + REPORT_COOLDOWN_MS;
  return unlock > now ? unlock : null;
}

export function reportWaitParts(remainingMs: number): { hours: number; minutes: number } {
  const totalMin = Math.max(1, Math.ceil(Math.max(0, remainingMs) / 60_000));
  return { hours: Math.floor(totalMin / 60), minutes: totalMin % 60 };
}

export function reportWaitLabel(
  remainingMs: number,
  hour: (count: number) => string,
  min: (count: number) => string,
): string {
  const { hours, minutes } = reportWaitParts(remainingMs);
  if (hours <= 0) return min(minutes);
  if (minutes <= 0) return hour(hours);
  return `${hour(hours)} ${min(minutes)}`;
}

export function isReportCooldownError(message?: string | null): boolean {
  return (message ?? '').toLowerCase().includes('report_cooldown');
}

export type ServiceReportKind = 'master' | 'offer';

export type ServiceReportTarget = {
  kind: ServiceReportKind;
  id: string;
  title: string;
};

export function reportMailUrl(
  target: ServiceReportTarget,
  message: string,
  reporter?: string | null,
): string {
  const text = message.trim().slice(0, REPORT_MAX);
  const subject = `Workly report: ${target.title}`.slice(0, 90);
  const body = [
    text,
    `type: ${target.kind}`,
    `id: ${target.id}`,
    reporter ? `from: ${reporter}` : '',
  ]
    .filter(Boolean)
    .join('\n');
  return `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

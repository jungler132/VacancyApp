type AppNotice = {
  title: string;
  body: string;
  confirmLabel?: string;
  hideCancel?: boolean;
  danger?: boolean;
  onConfirm?: () => void;
};

let current: AppNotice | null = null;
const listeners = new Set<(notice: AppNotice | null) => void>();

function emit(notice: AppNotice | null) {
  current = notice;
  for (const listener of listeners) listener(notice);
}

export function subscribeAppNotice(listener: (notice: AppNotice | null) => void): () => void {
  listeners.add(listener);
  listener(current);
  return () => listeners.delete(listener);
}

export function dismissAppNotice() {
  emit(null);
}

export function showAppNotice(title: string, body: string) {
  emit({ title, body, hideCancel: true });
}

export function showAppConfirm({
  title,
  body,
  confirmLabel,
  danger,
  onConfirm,
}: {
  title: string;
  body: string;
  confirmLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
}) {
  emit({ title, body, confirmLabel, danger, onConfirm });
}

export type { AppNotice };

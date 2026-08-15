import { memo, useState } from 'react';
import { Banner } from 'react-native-paper';

import type { SourceError } from '@/lib/types';

export const ErrorBanner = memo(function ErrorBanner({
  errors,
  onRetry,
  onDismiss,
}: {
  errors: SourceError[];
  onRetry?: () => void;
  onDismiss?: () => void;
}) {
  const [open, setOpen] = useState(true);
  const safe = errors.filter((error) => error?.sourceName && error?.message);
  if (!safe.length) return null;

  const actions = [
    { label: open ? 'Скрыть' : 'Подробнее', onPress: () => setOpen((value) => !value) },
    ...(onRetry ? [{ label: 'Повтор', onPress: onRetry }] : []),
    ...(onDismiss ? [{ label: 'Закрыть', onPress: onDismiss }] : []),
  ];

  const countLabel =
    safe.length === 1
      ? '1 источник не ответил'
      : safe.length < 5
        ? `${safe.length} источника не ответили`
        : `${safe.length} источников не ответили`;

  return (
    <Banner visible icon="alert-circle-outline" actions={actions}>
      {countLabel}
      {open ? `\n${safe.map((error) => `${error.sourceName} — ${error.message}`).join('\n')}` : ''}
    </Banner>
  );
});

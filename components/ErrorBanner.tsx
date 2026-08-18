import { memo, useState } from 'react';
import { Banner } from 'react-native-paper';

import { useT } from '@/lib/i18n/useT';
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
  const t = useT();
  const [open, setOpen] = useState(true);
  const safe = errors.filter((error) => error?.sourceName && error?.message);
  if (!safe.length) return null;

  const actions = [
    { label: open ? t('common.hide') : t('errors.details'), onPress: () => setOpen((value) => !value) },
    ...(onRetry ? [{ label: t('errors.retry'), onPress: onRetry }] : []),
    ...(onDismiss ? [{ label: t('errors.close'), onPress: onDismiss }] : []),
  ];

  const countLabel =
    safe.length === 1
      ? t('errors.one')
      : safe.length < 5
        ? t('errors.few', { count: safe.length })
        : t('errors.many', { count: safe.length });

  return (
    <Banner visible icon="alert-circle-outline" actions={actions}>
      {countLabel}
      {open ? `\n${safe.map((error) => `${error.sourceName} — ${error.message}`).join('\n')}` : ''}
    </Banner>
  );
});

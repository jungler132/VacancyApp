import { memo, useEffect, useState } from 'react';

import { ConfirmModal } from '@/components/ConfirmModal';
import { dismissAppNotice, subscribeAppNotice, type AppNotice } from '@/lib/appNotice';
import { useT } from '@/lib/i18n/useT';

export const AppNoticeHost = memo(function AppNoticeHost() {
  const t = useT();
  const [notice, setNotice] = useState<AppNotice | null>(null);

  useEffect(() => subscribeAppNotice(setNotice), []);

  return (
    <ConfirmModal
      open={Boolean(notice)}
      title={notice?.title ?? ''}
      body={notice?.body ?? ''}
      confirmLabel={notice?.hideCancel ? t('common.ok') : notice?.confirmLabel}
      hideCancel={notice?.hideCancel}
      danger={notice?.danger}
      onConfirm={() => {
        notice?.onConfirm?.();
        dismissAppNotice();
      }}
      onClose={dismissAppNotice}
    />
  );
});

import { memo, useCallback, useEffect, useState, type ComponentType, type ReactNode } from 'react';

import { afterFirstPaint } from '@/lib/afterPaint';
import { BillingProvider, defaultBilling, type BillingApi } from '@/lib/billingContext';
import { useAppSelector } from '@/lib/store/hooks';

type Runtime = ComponentType<{ onChange: (value: BillingApi) => void }>;

export const BillingHost = memo(function BillingHost({ children }: { children: ReactNode }) {
  const tourDone = useAppSelector((state) => state.onboarding.ready && state.onboarding.dismissed);
  const [allowIap, setAllowIap] = useState(false);
  const [Runtime, setRuntime] = useState<Runtime | null>(null);
  const [api, setApi] = useState<BillingApi>(defaultBilling);
  const onChange = useCallback((value: BillingApi) => setApi(value), []);

  useEffect(() => {
    if (tourDone) setAllowIap(true);
  }, [tourDone]);

  useEffect(() => {
    if (!allowIap) return undefined;
    return afterFirstPaint(() => {
      void import('@/components/BillingIapRuntime').then((mod) => setRuntime(() => mod.BillingIapRuntime));
    });
  }, [allowIap]);

  return (
    <BillingProvider value={api}>
      {children}
      {Runtime ? <Runtime onChange={onChange} /> : null}
    </BillingProvider>
  );
});

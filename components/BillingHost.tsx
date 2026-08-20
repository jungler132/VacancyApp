import { type ReactNode } from 'react';

import { BillingProvider, defaultBilling } from '@/lib/billingContext';

export function BillingHost({ children }: { children: ReactNode }) {
  return <BillingProvider value={defaultBilling}>{children}</BillingProvider>;
}

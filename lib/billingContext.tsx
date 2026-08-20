import { createContext, useContext, type ReactNode } from 'react';

export type BillingApi = {
  priceLabel: string | null;
  purchasing: boolean;
  buy: () => void;
  restore: () => void;
  storeBlocked: boolean;
  dismissStoreBlocked: () => void;
  tryTest?: () => void;
};

export const defaultBilling: BillingApi = {
  priceLabel: null,
  purchasing: false,
  buy: () => undefined,
  restore: () => undefined,
  storeBlocked: false,
  dismissStoreBlocked: () => undefined,
};

export const BillingContext = createContext<BillingApi>(defaultBilling);

export function useBilling(): BillingApi {
  return useContext(BillingContext);
}

export function BillingProvider({
  value,
  children,
}: {
  value: BillingApi;
  children: ReactNode;
}) {
  return <BillingContext.Provider value={value}>{children}</BillingContext.Provider>;
}

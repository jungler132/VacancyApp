import { memo, useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { Platform } from 'react-native';
import { finishTransaction, isUserCancelledError, useIAP, type Purchase } from 'expo-iap';

import { PREMIUM_SKU, purchaseHasPremiumSku } from '@/lib/billing';
import { BillingProvider } from '@/lib/billingContext';
import { closePaywall, grantPremium } from '@/lib/store/premiumSlice';
import { useAppDispatch, useAppSelector } from '@/lib/store/hooks';

function isPremiumPurchase(purchase: Purchase): boolean {
  return purchaseHasPremiumSku([purchase.productId]);
}

const allowTestPremium = typeof __DEV__ !== 'undefined' && __DEV__;

export const BillingHost = memo(function BillingHost({ children }: { children: ReactNode }) {
  const dispatch = useAppDispatch();
  const isPremium = useAppSelector((state) => state.premium.isPremium);
  const [purchasing, setPurchasing] = useState(false);
  const [storeBlocked, setStoreBlocked] = useState(false);

  const onPurchaseSuccess = useCallback(
    (purchase: Purchase) => {
      void (async () => {
        try {
          if (!isPremiumPurchase(purchase)) return;
          await finishTransaction({ purchase, isConsumable: false });
          await dispatch(grantPremium());
          dispatch(closePaywall());
        } finally {
          setPurchasing(false);
        }
      })();
    },
    [dispatch],
  );

  const onPurchaseError = useCallback((error: unknown) => {
    setPurchasing(false);
    if (isUserCancelledError(error)) return;
    setStoreBlocked(true);
  }, []);

  const { connected, products, availablePurchases, fetchProducts, getAvailablePurchases, requestPurchase, restorePurchases } =
    useIAP({
      onPurchaseSuccess,
      onPurchaseError,
    });

  useEffect(() => {
    if (__DEV__ || Platform.OS !== 'android' || !connected) return;
    void fetchProducts({ skus: [PREMIUM_SKU], type: 'in-app' }).catch(() => undefined);
    void getAvailablePurchases().catch(() => undefined);
  }, [connected, fetchProducts, getAvailablePurchases]);

  useEffect(() => {
    if (isPremium) return;
    const owned = availablePurchases.find(isPremiumPurchase);
    if (!owned) return;
    void (async () => {
      await finishTransaction({ purchase: owned, isConsumable: false }).catch(() => undefined);
      await dispatch(grantPremium());
    })();
  }, [availablePurchases, dispatch, isPremium]);

  const priceLabel = useMemo(() => {
    const product = products.find((item) => item.id === PREMIUM_SKU);
    return product?.displayPrice ?? null;
  }, [products]);

  const buy = useCallback(() => {
    if (purchasing) return;
    if (__DEV__) {
      setStoreBlocked(true);
      return;
    }
    setPurchasing(true);
    void requestPurchase({
      request: { google: { skus: [PREMIUM_SKU] } },
      type: 'in-app',
    }).catch(() => {
      setPurchasing(false);
      setStoreBlocked(true);
    });
  }, [purchasing, requestPurchase]);

  const restore = useCallback(() => {
    if (__DEV__) {
      setStoreBlocked(true);
      return;
    }
    void (async () => {
      try {
        await restorePurchases();
        await getAvailablePurchases();
      } catch {
        setStoreBlocked(true);
      }
    })();
  }, [getAvailablePurchases, restorePurchases]);

  const tryTest = useCallback(() => {
    void dispatch(grantPremium());
    setStoreBlocked(false);
  }, [dispatch]);

  const value = useMemo(
    () => ({
      priceLabel,
      purchasing,
      buy,
      restore,
      storeBlocked,
      dismissStoreBlocked: () => setStoreBlocked(false),
      tryTest: allowTestPremium ? tryTest : undefined,
    }),
    [buy, priceLabel, purchasing, restore, storeBlocked, tryTest],
  );

  return <BillingProvider value={value}>{children}</BillingProvider>;
});

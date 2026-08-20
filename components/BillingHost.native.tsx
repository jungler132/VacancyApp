import { memo, useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { Alert, Platform } from 'react-native';
import { finishTransaction, isUserCancelledError, useIAP, type Purchase } from 'expo-iap';

import { PREMIUM_SKU, purchaseHasPremiumSku } from '@/lib/billing';
import { BillingProvider } from '@/lib/billingContext';
import { useT } from '@/lib/i18n/useT';
import { closePaywall, grantPremium } from '@/lib/store/premiumSlice';
import { useAppDispatch, useAppSelector } from '@/lib/store/hooks';

function isPremiumPurchase(purchase: Purchase): boolean {
  return purchaseHasPremiumSku([purchase.productId]);
}

export const BillingHost = memo(function BillingHost({ children }: { children: ReactNode }) {
  const t = useT();
  const dispatch = useAppDispatch();
  const isPremium = useAppSelector((state) => state.premium.isPremium);
  const [purchasing, setPurchasing] = useState(false);

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

  const onPurchaseError = useCallback(
    (error: unknown) => {
      setPurchasing(false);
      if (isUserCancelledError(error)) return;
      Alert.alert(t('paywall.title'), t('paywall.needStore'));
    },
    [t],
  );

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
      Alert.alert(t('paywall.title'), t('paywall.needStore'));
      return;
    }
    setPurchasing(true);
    void requestPurchase({
      request: { google: { skus: [PREMIUM_SKU] } },
      type: 'in-app',
    }).catch(() => {
      setPurchasing(false);
      Alert.alert(t('paywall.title'), t('paywall.needStore'));
    });
  }, [purchasing, requestPurchase, t]);

  const restore = useCallback(() => {
    if (__DEV__) {
      Alert.alert(t('paywall.title'), t('paywall.needStore'));
      return;
    }
    void (async () => {
      try {
        await restorePurchases();
        await getAvailablePurchases();
      } catch {
        Alert.alert(t('paywall.title'), t('paywall.needStore'));
      }
    })();
  }, [getAvailablePurchases, restorePurchases, t]);

  const value = useMemo(
    () => ({ priceLabel, purchasing, buy, restore }),
    [buy, priceLabel, purchasing, restore],
  );

  return <BillingProvider value={value}>{children}</BillingProvider>;
});

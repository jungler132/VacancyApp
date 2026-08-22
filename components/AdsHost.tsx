import { memo, useEffect, useRef } from 'react';

import { startAds } from '@/lib/admobRuntime';
import { useAppSelector } from '@/lib/store/hooks';

export const AdsHost = memo(function AdsHost() {
  const premium = useAppSelector((state) => state.premium.isPremium);
  const premiumRef = useRef(premium);
  premiumRef.current = premium;

  useEffect(() => {
    let stop: (() => void) | undefined;
    stop = startAds(() => premiumRef.current);
    return () => {
      stop?.();
    };
  }, []);

  return null;
});

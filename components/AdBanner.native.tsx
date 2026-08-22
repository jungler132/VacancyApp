import { memo, useEffect, useState, type ComponentType } from 'react';

import { afterFirstPaint } from '@/lib/afterPaint';
import { useAppSelector } from '@/lib/store/hooks';

export const AdBanner = memo(function AdBanner() {
  const premium = useAppSelector((state) => state.premium.isPremium);
  const [Live, setLive] = useState<ComponentType | null>(null);

  useEffect(() => {
    if (premium) return undefined;
    return afterFirstPaint(() => {
      void import('@/components/AdBannerLive').then((mod) => setLive(() => mod.AdBannerLive));
    });
  }, [premium]);

  if (premium || !Live) return null;
  return <Live />;
});

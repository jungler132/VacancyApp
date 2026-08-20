import { memo, useCallback, useState } from 'react';
import { View } from 'react-native';
import { BannerAd, BannerAdSize } from 'react-native-google-mobile-ads';

import { AD_KEYWORDS, bannerUnitId } from '@/lib/ads';
import { useAppSelector } from '@/lib/store/hooks';
import { useThemedStyles, type ThemeColors } from '@/lib/theme';

export const AdBanner = memo(function AdBanner() {
  const styles = useThemedStyles(adBannerStyles);
  const premium = useAppSelector((state) => state.premium.isPremium);
  const [failed, setFailed] = useState(false);
  const onFail = useCallback(() => setFailed(true), []);

  if (premium || failed) return null;

  return (
    <View style={styles.wrap}>
      <BannerAd
        unitId={bannerUnitId()}
        size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
        requestOptions={{ keywords: AD_KEYWORDS }}
        onAdFailedToLoad={onFail}
      />
    </View>
  );
});

function adBannerStyles(colors: ThemeColors) {
  return {
    wrap: {
      backgroundColor: colors.bg,
      borderTopWidth: 1,
      borderTopColor: colors.cardBorder,
      alignItems: 'center' as const,
    },
  };
}

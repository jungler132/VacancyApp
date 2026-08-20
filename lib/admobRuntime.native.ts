import mobileAds, { AdsConsent, AdEventType, InterstitialAd } from 'react-native-google-mobile-ads';

import {
  AD_KEYWORDS,
  canShowInterstitial,
  interstitialUnitId,
  markInterstitialShown,
  noteEligibleOpen,
  subscribeInterstitialRequest,
} from '@/lib/ads';

export function startAds(isPremium: () => boolean): () => void {
  const interstitial = InterstitialAd.createForAdRequest(interstitialUnitId(), {
    keywords: AD_KEYWORDS,
  });

  let loaded = false;

  const unsubLoaded = interstitial.addAdEventListener(AdEventType.LOADED, () => {
    loaded = true;
  });
  const unsubClosed = interstitial.addAdEventListener(AdEventType.CLOSED, () => {
    loaded = false;
    interstitial.load();
  });
  const unsubError = interstitial.addAdEventListener(AdEventType.ERROR, () => {
    loaded = false;
  });

  const unsubRequest = subscribeInterstitialRequest(() => {
    if (isPremium()) return;
    if (!noteEligibleOpen()) return;
    if (!canShowInterstitial()) return;
    if (!loaded) return;
    loaded = false;
    markInterstitialShown();
    void interstitial.show();
  });

  void (async () => {
    try {
      await AdsConsent.requestInfoUpdate();
      await AdsConsent.loadAndShowConsentFormIfRequired();
    } catch {
      // UMP is optional outside the EEA; ads still initialize.
    }
    try {
      await mobileAds().initialize();
      interstitial.load();
    } catch {
      loaded = false;
    }
  })();

  return () => {
    unsubLoaded();
    unsubClosed();
    unsubError();
    unsubRequest();
  };
}

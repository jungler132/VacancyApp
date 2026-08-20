const fs = require('fs');
const path = require('path');

const ADS_PIN = '24.7.0';
const root = path.join(__dirname, '..', 'node_modules', 'react-native-google-mobile-ads');
const pkgFile = path.join(root, 'package.json');
const nativeDir = path.join(root, 'android', 'src', 'main', 'java', 'io', 'invertase', 'googlemobileads');
const ktFile = path.join(nativeDir, 'ReactNativeGoogleMobileAdsModule.kt');
const commonFile = path.join(nativeDir, 'ReactNativeGoogleMobileAdsCommon.java');

if (fs.existsSync(pkgFile)) {
  const pkg = JSON.parse(fs.readFileSync(pkgFile, 'utf8'));
  if (pkg.sdkVersions?.android?.googleMobileAds && pkg.sdkVersions.android.googleMobileAds !== ADS_PIN) {
    pkg.sdkVersions.android.googleMobileAds = ADS_PIN;
    fs.writeFileSync(pkgFile, `${JSON.stringify(pkg, null, 2)}\n`);
    console.log(`pinned react-native-google-mobile-ads play-services-ads to ${ADS_PIN}`);
  }
}

if (fs.existsSync(ktFile)) {
  let source = fs.readFileSync(ktFile, 'utf8');
  const next = source
    .replace('import com.google.android.gms.ads.AgeRestrictedTreatment\n', '')
    .replace(
      /    if \(requestConfiguration\.hasKey\("ageRestrictedTreatment"\)\) \{[\s\S]*?\n    \}\n\n/,
      '',
    );
  if (next !== source) {
    fs.writeFileSync(ktFile, next);
    console.log('stripped AgeRestrictedTreatment for play-services-ads 24.x');
  }
}

if (fs.existsSync(commonFile)) {
  let source = fs.readFileSync(commonFile, 'utf8');
  const next = source.replace(
    'AdSize.getLargeAnchoredAdaptiveBannerAdSize',
    'AdSize.getCurrentOrientationAnchoredAdaptiveBannerAdSize',
  );
  if (next !== source) {
    fs.writeFileSync(commonFile, next);
    console.log('mapped LARGE_ANCHORED_ADAPTIVE_BANNER to anchored adaptive for ads 24.x');
  }
}

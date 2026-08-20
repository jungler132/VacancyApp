const { withAppBuildGradle } = require('expo/config-plugins');

/**
 * Local sideload only: release builds use the debug keystore.
 * Do not upload that AAB/APK to Google Play — create an upload keystore first.
 */
function withAndroidReleaseSigning(config) {
  return withAppBuildGradle(config, (mod) => {
    const src = mod.modResults.contents;
    const releaseIdx = src.search(/release\s*\{/);
    if (releaseIdx === -1) return mod;

    const brace = src.indexOf('{', releaseIdx);
    const window = src.slice(brace, brace + 500);
    if (window.includes('signingConfig')) return mod;

    mod.modResults.contents = src.replace(/release\s*\{/, 'release {\n            signingConfig signingConfigs.debug');
    return mod;
  });
}

module.exports = withAndroidReleaseSigning;

const { withAppBuildGradle } = require('expo/config-plugins');

/** Release APK must be signed; use the debug keystore for local sideload builds. */
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

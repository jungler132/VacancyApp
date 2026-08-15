const { withGradleProperties } = require('expo/config-plugins');

function setProperty(mod, key, value) {
  const i = mod.modResults.findIndex((item) => item.type === 'property' && item.key === key);
  if (i >= 0) {
    mod.modResults[i].value = value;
    return;
  }
  mod.modResults.push({ type: 'property', key, value });
}

/** Drop unused image codecs from the release APK. */
function withAndroidApkSize(config) {
  return withGradleProperties(config, (mod) => {
    setProperty(mod, 'expo.gif.enabled', 'false');
    setProperty(mod, 'expo.webp.animated', 'false');
    return mod;
  });
}

module.exports = withAndroidApkSize;

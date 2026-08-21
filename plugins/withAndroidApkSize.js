const { withAndroidStyles, withGradleProperties } = require('expo/config-plugins');

function setProperty(mod, key, value) {
  const i = mod.modResults.findIndex((item) => item.type === 'property' && item.key === key);
  if (i >= 0) {
    mod.modResults[i].value = value;
    return;
  }
  mod.modResults.push({ type: 'property', key, value });
}

function withWindowBackground(config) {
  return withAndroidStyles(config, (mod) => {
    const resources = mod.modResults.resources;
    const styles = [].concat(resources.style || []);
    for (const style of styles) {
      if (style.$?.name !== 'AppTheme') continue;
      const items = [].concat(style.item || []);
      if (items.some((item) => item.$?.name === 'android:windowBackground')) continue;
      items.push({ $: { name: 'android:windowBackground' }, _: '@color/splashscreen_background' });
      style.item = items;
    }
    resources.style = styles;
    return mod;
  });
}

/** Drop unused image codecs from the release APK. Keep launch window navy, not black. */
function withAndroidApkSize(config) {
  config = withGradleProperties(config, (mod) => {
    setProperty(mod, 'expo.gif.enabled', 'false');
    setProperty(mod, 'expo.webp.animated', 'false');
    return mod;
  });
  return withWindowBackground(config);
}

module.exports = withAndroidApkSize;

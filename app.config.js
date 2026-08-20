const app = require('./app.json');

const androidAppId =
  process.env.EXPO_PUBLIC_ADMOB_ANDROID_APP_ID || 'ca-app-pub-3940256099942544~3347511713';
const iosAppId =
  process.env.EXPO_PUBLIC_ADMOB_IOS_APP_ID || 'ca-app-pub-3940256099942544~1458002511';

module.exports = {
  expo: {
    ...app.expo,
    plugins: app.expo.plugins.map((plugin) => {
      if (Array.isArray(plugin) && plugin[0] === 'react-native-google-mobile-ads') {
        return [
          'react-native-google-mobile-ads',
          {
            ...plugin[1],
            androidAppId,
            iosAppId,
          },
        ];
      }
      return plugin;
    }),
  },
};

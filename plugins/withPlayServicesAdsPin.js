const { withProjectBuildGradle } = require('expo/config-plugins');

const PIN = '24.7.0';
const MARKER = 'play-services-ads pin for Expo 57 Kotlin 2.1';

const BLOCK = `
// ${MARKER}
subprojects { sub ->
  sub.configurations.configureEach {
    resolutionStrategy.eachDependency { details ->
      if (details.requested.group == 'com.google.android.gms' && (details.requested.name == 'play-services-ads' || details.requested.name == 'play-services-ads-lite')) {
        details.useVersion '${PIN}'
      }
    }
  }
}
`;

/** play-services-ads 25.4.0 is Kotlin 2.3; Expo 57 compiles with 2.1.20. */
function withPlayServicesAdsPin(config) {
  return withProjectBuildGradle(config, (mod) => {
    if (mod.modResults.contents.includes(MARKER)) return mod;
    mod.modResults.contents += BLOCK;
    return mod;
  });
}

module.exports = withPlayServicesAdsPin;

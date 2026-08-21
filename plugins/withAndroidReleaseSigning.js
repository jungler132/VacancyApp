const { withAppBuildGradle } = require('expo/config-plugins');

const MARKER = 'VAKANO_UPLOAD_SIGNING';

const LOAD_BLOCK = `
// ${MARKER}
def vakanoKsFile = rootProject.file("../keystore.properties")
def vakanoKs = new Properties()
if (vakanoKsFile.exists()) {
    vakanoKsFile.withInputStream { vakanoKs.load(it) }
}
`;

const UPLOAD_CONFIG = `        upload {
            if (vakanoKsFile.exists()) {
                keyAlias vakanoKs['keyAlias']
                keyPassword vakanoKs['keyPassword']
                storeFile rootProject.file("../" + vakanoKs['storeFile'])
                storePassword vakanoKs['storePassword']
            }
        }
`;

const RELEASE_SIGNING =
  'signingConfig vakanoKsFile.exists() ? signingConfigs.upload : signingConfigs.debug';

function withAndroidReleaseSigning(config) {
  return withAppBuildGradle(config, (mod) => {
    let src = mod.modResults.contents;
    if (src.includes(MARKER)) return mod;

    if (!/\nandroid\s*\{/.test(src)) return mod;
    src = src.replace(/\nandroid\s*\{/, `${LOAD_BLOCK}\nandroid {`);

    if (!src.includes('signingConfigs.upload') && /signingConfigs\s*\{/.test(src)) {
      src = src.replace(/signingConfigs\s*\{/, `signingConfigs {\n${UPLOAD_CONFIG}`);
    }

    if (src.includes(RELEASE_SIGNING)) {
      mod.modResults.contents = src;
      return mod;
    }

    const releaseWithDebug = /release\s*\{\s*signingConfig signingConfigs\.debug/;
    if (releaseWithDebug.test(src)) {
      src = src.replace(
        releaseWithDebug,
        `release {\n            ${RELEASE_SIGNING}`,
      );
    } else {
      src = src.replace(/release\s*\{/, `release {\n            ${RELEASE_SIGNING}`);
    }

    mod.modResults.contents = src;
    return mod;
  });
}

module.exports = withAndroidReleaseSigning;

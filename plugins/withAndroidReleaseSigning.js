const { withAppBuildGradle } = require('expo/config-plugins');

const MARKER = 'VAKANO_UPLOAD_SIGNING';

const LOAD_BLOCK = `
// ${MARKER}
def vakanoKsFile = rootProject.file("../keystore.properties")
def vakanoKs = new Properties()
if (vakanoKsFile.exists()) {
    vakanoKsFile.withInputStream { vakanoKs.load(it) }
}
def vakanoKsVal = { key -> vakanoKs[key] ? vakanoKs[key].toString().trim() : '' }
`;

const UPLOAD_CONFIG = `        upload {
            if (vakanoKsFile.exists()) {
                keyAlias vakanoKsVal('keyAlias')
                keyPassword vakanoKsVal('keyPassword')
                storeFile rootProject.file("../" + vakanoKsVal('storeFile'))
                storePassword vakanoKsVal('storePassword')
            }
        }
`;

const RELEASE_SIGNING =
  'signingConfig = vakanoKsFile.exists() ? signingConfigs.upload : signingConfigs.debug';

function patchReleaseSigning(src) {
  const buildIdx = src.indexOf('buildTypes');
  if (buildIdx < 0) return src;
  const relIdx = src.indexOf('release {', buildIdx);
  if (relIdx < 0) return src;

  const before = src.slice(0, relIdx);
  let block = src.slice(relIdx);

  block = block.replace(
    /^\s*signingConfig vakanoKsFile\.exists\(\) \? signingConfigs\.upload : signingConfigs\.debug\s*\r?\n/m,
    '',
  );

  if (!block.includes(RELEASE_SIGNING)) {
    if (/signingConfig\s*=\s*signingConfigs\.debug/.test(block)) {
      block = block.replace(/signingConfig\s*=\s*signingConfigs\.debug/, RELEASE_SIGNING);
    } else {
      block = block.replace(/release\s*\{/, `release {\n            ${RELEASE_SIGNING}`);
    }
  }

  return before + block;
}

function withAndroidReleaseSigning(config) {
  return withAppBuildGradle(config, (mod) => {
    let src = mod.modResults.contents;

    if (!src.includes(MARKER)) {
      if (!/\nandroid\s*\{/.test(src)) return mod;
      src = src.replace(/\nandroid\s*\{/, `${LOAD_BLOCK}\nandroid {`);
    } else if (!src.includes('vakanoKsVal')) {
      src = src.replace(
        /def vakanoKs = new Properties\(\)\r?\n[\s\S]*?vakanoKs\.load\(it\)\r?\n\}\r?\n/,
        `def vakanoKs = new Properties()\nif (vakanoKsFile.exists()) {\n    vakanoKsFile.withInputStream { vakanoKs.load(it) }\n}\ndef vakanoKsVal = { key -> vakanoKs[key] ? vakanoKs[key].toString().trim() : '' }\n`,
      );
      src = src.replace(/vakanoKs\['(\w+)'\]/g, "vakanoKsVal('$1')");
    }

    if (!src.includes('signingConfigs.upload') && /signingConfigs\s*\{/.test(src)) {
      src = src.replace(/signingConfigs\s*\{/, `signingConfigs {\n${UPLOAD_CONFIG}`);
    }

    src = patchReleaseSigning(src);
    mod.modResults.contents = src;
    return mod;
  });
}

module.exports = withAndroidReleaseSigning;

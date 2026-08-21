const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

const root = path.resolve(__dirname, '..');
const androidDir = path.join(root, 'android');
const distDir = path.join(root, 'dist');
const outAab = path.join(distDir, 'Vakano.aab');
const keystore = path.join(root, 'upload-keystore.jks');
const props = path.join(root, 'keystore.properties');

function exists(file) {
  try {
    fs.accessSync(file);
    return true;
  } catch {
    return false;
  }
}

function findJavaHome() {
  const candidates = [
    process.env.JAVA_HOME,
    'C:\\Program Files\\Microsoft\\jdk-17.0.12.7-hotspot',
    'C:\\Program Files\\Android\\Android Studio\\jbr',
    'C:\\Program Files\\Android\\Android Studio\\jre',
  ].filter(Boolean);

  for (const dir of candidates) {
    const java = path.join(dir, 'bin', process.platform === 'win32' ? 'java.exe' : 'java');
    if (exists(java)) return dir;
  }
  return process.env.JAVA_HOME || '';
}

function findAndroidSdk() {
  const candidates = [
    process.env.ANDROID_HOME,
    process.env.ANDROID_SDK_ROOT,
    path.join(process.env.LOCALAPPDATA || '', 'Android', 'Sdk'),
    path.join(os.homedir(), 'AppData', 'Local', 'Android', 'Sdk'),
  ].filter(Boolean);
  return candidates.find((dir) => exists(dir)) || '';
}

function run(command, args, cwd) {
  const result = spawnSync(command, args, {
    cwd,
    stdio: 'inherit',
    shell: process.platform === 'win32',
    env: process.env,
  });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

if (!exists(keystore) || !exists(props)) {
  console.error('Нет upload-keystore.jks или keystore.properties. Сначала: node scripts/make-upload-keystore.cjs');
  process.exit(1);
}

const javaHome = findJavaHome();
const androidHome = findAndroidSdk();
if (!javaHome) {
  console.error('Не найден JDK 17.');
  process.exit(1);
}
if (!androidHome) {
  console.error('Не найден Android SDK.');
  process.exit(1);
}

process.env.JAVA_HOME = javaHome;
process.env.ANDROID_HOME = androidHome;
process.env.ANDROID_SDK_ROOT = androidHome;
process.env.EXPO_NO_TELEMETRY = '1';
process.env.CI = '1';
process.env.PATH = `${path.join(javaHome, 'bin')}${path.delimiter}${process.env.PATH}`;

console.log(`JDK: ${javaHome}`);
console.log(`SDK: ${androidHome}`);
console.log('Prebuild + bundleRelease (AAB для Play)...\n');

const expoBin = process.platform === 'win32'
  ? path.join(root, 'node_modules', '.bin', 'expo.cmd')
  : path.join(root, 'node_modules', '.bin', 'expo');

run(expoBin, ['prebuild', '-p', 'android', '--non-interactive'], root);

const gradlew = process.platform === 'win32' ? 'gradlew.bat' : './gradlew';
run(gradlew, ['bundleRelease'], androidDir);

const built = path.join(androidDir, 'app', 'build', 'outputs', 'bundle', 'release', 'app-release.aab');
if (!exists(built)) {
  console.error('Gradle завершился, но AAB не найден.');
  process.exit(1);
}

fs.mkdirSync(distDir, { recursive: true });
fs.copyFileSync(built, outAab);
console.log(`\nГотово: ${outAab}`);
console.log('Этот файл заливать в Play Console → Closed testing → Create new release.');

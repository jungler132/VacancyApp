const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

const root = path.resolve(__dirname, '..');
const androidDir = path.join(root, 'android');
const distDir = path.join(root, 'dist');
const outApk = path.join(distDir, 'Workly.apk');

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
    path.join(os.homedir(), '.jdks'),
  ].filter(Boolean);

  for (const dir of candidates) {
    const java = path.join(dir, 'bin', process.platform === 'win32' ? 'java.exe' : 'java');
    if (exists(java)) return dir;
  }

  const studio = 'C:\\Program Files\\Android\\Android Studio\\jbr';
  if (exists(path.join(studio, 'bin', 'java.exe'))) return studio;
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

function findBuiltApk() {
  const base = path.join(androidDir, 'app', 'build', 'outputs', 'apk');
  if (!exists(base)) return null;
  const wanted = ['release/app-release.apk', 'release/app-release-unsigned.apk', 'debug/app-debug.apk'];
  for (const rel of wanted) {
    const file = path.join(base, rel);
    if (exists(file)) return file;
  }
  return null;
}

const javaHome = findJavaHome();
const androidHome = findAndroidSdk();

if (!javaHome) {
  console.error('Не найден JDK 17. Поставь Android Studio или Microsoft OpenJDK 17 и повтори yarn apk.');
  process.exit(1);
}
if (!androidHome) {
  console.error('Не найден Android SDK. Установи Android Studio, открой его один раз, затем повтори yarn apk.');
  process.exit(1);
}

process.env.JAVA_HOME = javaHome;
process.env.ANDROID_HOME = androidHome;
process.env.ANDROID_SDK_ROOT = androidHome;
process.env.EXPO_NO_TELEMETRY = '1';

const javaBin = path.join(javaHome, 'bin');
process.env.PATH = `${javaBin}${path.delimiter}${process.env.PATH}`;

console.log(`JDK: ${javaHome}`);
console.log(`SDK: ${androidHome}`);
console.log('Генерирую android/ и собираю release APK...\n');

const expoBin = process.platform === 'win32'
  ? path.join(root, 'node_modules', '.bin', 'expo.cmd')
  : path.join(root, 'node_modules', '.bin', 'expo');

run(expoBin, ['prebuild', '-p', 'android', '--non-interactive'], root);

const gradlew = process.platform === 'win32' ? 'gradlew.bat' : './gradlew';
run(gradlew, ['assembleRelease'], androidDir);

const built = findBuiltApk();
if (!built) {
  console.error('Gradle завершился, но APK не найден в android/app/build/outputs/apk/');
  process.exit(1);
}

fs.mkdirSync(distDir, { recursive: true });
fs.copyFileSync(built, outApk);
console.log(`\nГотово: ${outApk}`);

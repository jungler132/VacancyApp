const { spawnSync } = require('child_process');
const crypto = require('crypto');
const fs = require('fs');
const os = require('os');
const path = require('path');

const root = path.resolve(__dirname, '..');
const keystorePath = path.join(root, 'upload-keystore.jks');
const propsPath = path.join(root, 'keystore.properties');
const alias = 'upload';

function exists(file) {
  try {
    fs.accessSync(file);
    return true;
  } catch {
    return false;
  }
}

function findKeytool() {
  const names = process.platform === 'win32' ? 'keytool.exe' : 'keytool';
  const candidates = [
    process.env.JAVA_HOME && path.join(process.env.JAVA_HOME, 'bin', names),
    'C:\\Program Files\\Microsoft\\jdk-17.0.12.7-hotspot\\bin\\keytool.exe',
    'C:\\Program Files\\Android\\Android Studio\\jbr\\bin\\keytool.exe',
    'C:\\Program Files\\Android\\Android Studio\\jre\\bin\\keytool.exe',
  ].filter(Boolean);
  return candidates.find((file) => exists(file)) || names;
}

if (exists(keystorePath)) {
  console.error(`Уже есть ${keystorePath}. Новый не создаю — иначе сломается подпись Play.`);
  process.exit(1);
}

const password = crypto.randomBytes(24).toString('base64url');
const keytool = findKeytool();
const result = spawnSync(
  keytool,
  [
    '-genkeypair',
    '-v',
    '-storetype',
    'PKCS12',
    '-keystore',
    keystorePath,
    '-alias',
    alias,
    '-keyalg',
    'RSA',
    '-keysize',
    '2048',
    '-validity',
    '10000',
    '-storepass',
    password,
    '-keypass',
    password,
    '-dname',
    'CN=Vakano, OU=Mobile, O=Vakano, L=Baku, C=AZ',
  ],
  { stdio: 'inherit' },
);

if (result.status !== 0) {
  if (exists(keystorePath)) fs.unlinkSync(keystorePath);
  process.exit(result.status ?? 1);
}

const props = [
  '# Local Play upload signing. Never commit this file.',
  `storeFile=${path.basename(keystorePath)}`,
  `storePassword=${password}`,
  `keyAlias=${alias}`,
  `keyPassword=${password}`,
  '',
].join(os.EOL);

fs.writeFileSync(propsPath, props, { mode: 0o600 });
console.log(`\nГотово: ${keystorePath}`);
console.log(`Пароль записан в ${propsPath} (файл в .gitignore).`);
console.log('Скопируй пароль в менеджер паролей сейчас. Потеря ключа = нельзя обновлять приложение в Play.');

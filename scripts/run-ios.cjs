const { spawnSync } = require('child_process');
const path = require('path');

const root = path.resolve(__dirname, '..');
const bundleId = 'app.vakano.jobs';
const expoBin = path.join(root, 'node_modules', '.bin', 'expo');

function run(command, args, stdio = 'inherit') {
  return spawnSync(command, args, {
    cwd: root,
    encoding: 'utf8',
    stdio,
    env: process.env,
  });
}

function bootedUdid() {
  const result = run('xcrun', ['simctl', 'list', 'devices', 'booted', '-j'], 'pipe');
  if (result.status !== 0) return null;
  try {
    const data = JSON.parse(result.stdout || '{}');
    for (const list of Object.values(data.devices || {})) {
      const device = (list || []).find((item) => item.state === 'Booted');
      if (device) return device.udid;
    }
  } catch {
    return null;
  }
  return null;
}

function preferredUdid() {
  const current = bootedUdid();
  if (current) return current;

  const result = run('xcrun', ['simctl', 'list', 'devices', 'available', '-j'], 'pipe');
  if (result.status !== 0) return null;
  const data = JSON.parse(result.stdout || '{}');
  const devices = Object.values(data.devices || {})
    .flat()
    .filter((item) => item && item.isAvailable !== false);
  const iphone =
    devices.find((item) => /iPhone 17 Pro/.test(item.name)) ||
    devices.find((item) => /iPhone/.test(item.name));
  return iphone ? iphone.udid : null;
}

function allowDeepLink(udid) {
  const prefs = path.join(
    process.env.HOME || '',
    'Library/Developer/CoreSimulator/Devices',
    udid,
    'data/Library/Preferences/com.apple.launchservices.schemeapproval',
  );
  run(
    'defaults',
    ['write', prefs, 'com.apple.CoreSimulator.CoreSimulatorBridge-->app.vakano.jobs', bundleId],
    'pipe',
  );
}

function ensureSimulatorReady() {
  const udid = preferredUdid();
  if (!udid) return;

  run('open', ['-a', 'Simulator', '--args', '-CurrentDeviceUDID', udid]);
  run('xcrun', ['simctl', 'boot', udid], 'pipe');
  run('xcrun', ['simctl', 'bootstatus', udid, '-b']);
  allowDeepLink(udid);
  spawnSync('sleep', ['2']);
}

function launchVakano() {
  const udid = bootedUdid() || 'booted';
  return run('xcrun', ['simctl', 'launch', udid, bundleId]).status === 0;
}

ensureSimulatorReady();
const expo = run(expoBin, ['run:ios', ...process.argv.slice(2)]);
if (expo.status === 0) {
  process.exit(0);
}

if (launchVakano()) {
  console.log('Vakano launched on the simulator after Expo deep-link error 115.');
  process.exit(0);
}

process.exit(expo.status == null ? 1 : expo.status);

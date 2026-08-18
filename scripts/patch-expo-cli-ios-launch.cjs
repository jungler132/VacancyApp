const fs = require('fs');
const path = require('path');

const file = path.join(
  __dirname,
  '..',
  'node_modules',
  '@expo',
  'cli',
  'build',
  'src',
  'start',
  'platforms',
  'ios',
  'simctl.js',
);

if (!fs.existsSync(file)) {
  return;
}

const source = fs.readFileSync(file, 'utf8');
if (source.includes('LSApplicationWorkspaceErrorDomain') && source.includes("options.appId && (error.status === 115")) {
  return;
}

const needle = `    } catch (error) {
        var _error_stderr;
        if (!((_error_stderr = error.stderr) == null ? void 0 : _error_stderr.match(/Unable to lookup in current state: Shut/))) {
            throw error;
        }`;

const insert = `    } catch (error) {
        var _error_stderr;
        if (options.appId && (error.status === 115 || String(error.stderr || error.message || '').includes('LSApplicationWorkspaceErrorDomain'))) {
            try {
                await new Promise((resolve)=>setTimeout(resolve, 1200));
                await simctlAsync([
                    'openurl',
                    resolveId(device),
                    options.url
                ]);
                return;
            } catch  {
                await simctlAsync([
                    'launch',
                    resolveId(device),
                    options.appId
                ]);
                return;
            }
        }
        if (!((_error_stderr = error.stderr) == null ? void 0 : _error_stderr.match(/Unable to lookup in current state: Shut/))) {
            throw error;
        }`;

if (!source.includes(needle)) {
  return;
}

fs.writeFileSync(file, source.replace(needle, insert));
console.log('patched @expo/cli iOS simulator launch fallback for error 115');

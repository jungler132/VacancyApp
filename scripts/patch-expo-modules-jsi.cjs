const fs = require('fs');
const path = require('path');

const file = path.join(
  __dirname,
  '..',
  'node_modules',
  'expo-modules-jsi',
  'apple',
  'Sources',
  'ExpoModulesJSI',
  'Coding',
  'JavaScriptCodable+Date.swift',
);

if (!fs.existsSync(file)) {
  return;
}

const source = fs.readFileSync(file, 'utf8');
if (source.includes('Swift.abs(milliseconds)')) {
  return;
}

const next = source.replace('abs(milliseconds)', 'Swift.abs(milliseconds)');
if (next === source) {
  return;
}

fs.writeFileSync(file, next);
console.log('patched expo-modules-jsi Date.abs for Xcode < 26.4');

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { localeFromDevice } from './locale';

describe('localeFromDevice', () => {
  it('СНГ кроме Азербайджана — русский', () => {
    assert.equal(localeFromDevice({ languageCode: 'ru', regionCode: 'RU' }), 'ru');
    assert.equal(localeFromDevice({ languageCode: 'uk', regionCode: 'UA' }), 'ru');
    assert.equal(localeFromDevice({ languageCode: 'be', regionCode: 'BY' }), 'ru');
    assert.equal(localeFromDevice({ languageCode: 'kk', regionCode: 'KZ' }), 'ru');
    assert.equal(localeFromDevice({ languageCode: 'uz', regionCode: 'UZ' }), 'ru');
    assert.equal(localeFromDevice({ languageCode: 'hy', regionCode: 'AM' }), 'ru');
    assert.equal(localeFromDevice({ languageCode: 'en', regionCode: 'RU' }), 'ru');
    assert.equal(localeFromDevice({ languageTag: 'ru-KZ' }), 'ru');
  });

  it('Азербайджан и Турция — азербайджанский', () => {
    assert.equal(localeFromDevice({ languageCode: 'az', regionCode: 'AZ' }), 'az');
    assert.equal(localeFromDevice({ languageCode: 'tr', regionCode: 'TR' }), 'az');
    assert.equal(localeFromDevice({ languageCode: 'en', regionCode: 'AZ' }), 'az');
    assert.equal(localeFromDevice({ languageCode: 'ru', regionCode: 'TR' }), 'az');
    assert.equal(localeFromDevice({ languageTag: 'tr-TR' }), 'az');
  });

  it('остальное — английский', () => {
    assert.equal(localeFromDevice({ languageCode: 'en', regionCode: 'US' }), 'en');
    assert.equal(localeFromDevice({ languageCode: 'de', regionCode: 'DE' }), 'en');
    assert.equal(localeFromDevice({ languageCode: 'pl', regionCode: 'PL' }), 'en');
    assert.equal(localeFromDevice({ languageTag: 'fr-FR' }), 'en');
    assert.equal(localeFromDevice(null), 'en');
  });
});

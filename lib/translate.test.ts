import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { detectTextLocale, isUsableTranslation } from './translate';

describe('translate detect', () => {
  it('видит русский, английский и азербайджанский', () => {
    assert.equal(detectTextLocale('Курьер по городу'), 'ru');
    assert.equal(detectTextLocale('Junior React developer'), 'en');
    assert.equal(detectTextLocale('Bakıda satıcı tələb olunur'), 'az');
  });
});

describe('translate quality', () => {
  it('отбрасывает мусор MyMemory', () => {
    assert.equal(isUsableTranslation('MYMEMORY WARNING: YOU USED ALL AVAILABLE FREE TRANSLATIONS FOR TODAY'), false);
    assert.equal(isUsableTranslation('INVALID LANGUAGE PAIR'), false);
    assert.equal(isUsableTranslation('Courier across the city'), true);
  });
});

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { detectTextLocale } from './translate';

describe('translate detect', () => {
  it('видит русский, английский и азербайджанский', () => {
    assert.equal(detectTextLocale('Курьер по городу'), 'ru');
    assert.equal(detectTextLocale('Junior React developer'), 'en');
    assert.equal(detectTextLocale('Bakıda satıcı tələb olunur'), 'az');
  });
});

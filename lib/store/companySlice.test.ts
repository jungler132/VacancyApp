import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import reducer, { parseCompany, saveCompany } from './companySlice';

describe('company', () => {
  it('режет пустое имя и слишком длинные поля', () => {
    const parsed = parseCompany({ name: '  Acme  ', about: 'x'.repeat(600), logoUri: ' file://logo ' });
    assert.equal(parsed.name, 'Acme');
    assert.equal(parsed.about.length, 500);
    assert.equal(parsed.logoUri, 'file://logo');
  });

  it('сохраняет бренд', () => {
    const saved = reducer({ name: '', about: '', ready: true }, saveCompany({ name: 'Газпром', about: 'Нефть', logoUri: 'https://x/l.png' }));
    assert.equal(saved.name, 'Газпром');
    assert.equal(saved.about, 'Нефть');
    assert.equal(saved.logoUri, 'https://x/l.png');
  });
});

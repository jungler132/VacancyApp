import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { logoFromApplyUrl, normalizeLogoUrl } from './logo';

describe('normalizeLogoUrl', () => {
  it('принимает https и protocol-relative', () => {
    assert.equal(normalizeLogoUrl('https://hhcdn.ru/logo.png'), 'https://hhcdn.ru/logo.png');
    assert.equal(normalizeLogoUrl('//cdn.example.com/a.png'), 'https://cdn.example.com/a.png');
    assert.equal(normalizeLogoUrl('http://cdn.example.com/a.png'), 'https://cdn.example.com/a.png');
  });

  it('принимает локальный файл для своего логотипа', () => {
    assert.equal(normalizeLogoUrl('file:///data/user/0/app/cache/logo.jpg'), 'file:///data/user/0/app/cache/logo.jpg');
    assert.equal(normalizeLogoUrl('content://media/external/images/1'), 'content://media/external/images/1');
  });

  it('отбрасывает мусор', () => {
    assert.equal(normalizeLogoUrl(''), undefined);
    assert.equal(normalizeLogoUrl('not-a-url'), undefined);
    assert.equal(normalizeLogoUrl('/relative.png'), undefined);
  });
});

describe('logoFromApplyUrl', () => {
  it('не берёт фавикон площадки', () => {
    assert.equal(logoFromApplyUrl('https://www.arbeitnow.com/jobs/foo'), undefined);
    assert.equal(logoFromApplyUrl('https://hh.ru/vacancy/1'), undefined);
  });

  it('берёт фавикон сайта компании', () => {
    assert.equal(
      logoFromApplyUrl('https://careers.stripe.com/jobs/1'),
      'https://www.google.com/s2/favicons?domain=careers.stripe.com&sz=128',
    );
  });
});

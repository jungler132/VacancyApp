import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { detectTextLocale, isUsableTranslation, leftoverSourcePieces, needsTranslation, splitTranslateChunks } from './translate';

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

describe('translate chunks', () => {
  it('не выбрасывает хвост длинного описания', () => {
    const lines = Array.from({ length: 12 }, (_, i) => `${'Duty '.repeat(70)}END${i}`);
    const chunks = splitTranslateChunks(lines.join('\n'));
    const joined = chunks.join('\n');
    assert.ok(chunks.length > 5);
    assert.match(joined, /END0/);
    assert.match(joined, /END11/);
  });

  it('держит кусок в лимите MyMemory', () => {
    const chunk = 'я'.repeat(400);
    const parts = splitTranslateChunks(chunk, 450);
    assert.ok(parts.length >= 2);
    for (const part of parts) {
      assert.ok(new TextEncoder().encode(part).length <= 450);
    }
  });
});

describe('translate leftovers', () => {
  it('не считает тег и уже переведённый текст', () => {
    assert.equal(needsTranslation('#LI-AS1', 'az'), false);
    assert.equal(needsTranslation('Bakıda satıcı tələb olunur, maaş razılaşma ilə.', 'az'), false);
    assert.equal(needsTranslation('Applicants with disabilities are encouraged to apply for this role.', 'az'), true);
  });

  it('достаёт английский хвост из азербайджанского абзаца', () => {
    const mixed =
      'Komanda data modelləşdirməsi ilə məşğul olur və müştərilərə dəstək verir. Applicants with disabilities may request reasonable accommodation during the hiring process.';
    const leftovers = leftoverSourcePieces(mixed, 'az');
    assert.equal(leftovers.length, 1);
    assert.match(leftovers[0], /Applicants with disabilities/);
    assert.doesNotMatch(leftovers[0], /Komanda/);
  });
});

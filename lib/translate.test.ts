import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { detectTextLocale, isNetworkError, isSuccessfulTranslation, isUsableTranslation, leftoverSourcePieces, needsTranslation, splitTranslateChunks, translateFailCode } from './translate';

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

  it('считает азербайджанский перевод успешным даже без ə/ş', () => {
    assert.equal(
      isSuccessfulTranslation('Applicants with disabilities are encouraged to apply.', 'Evezsizliyi olan namizedler muraciet ede bilerler.', 'az'),
      true,
    );
    assert.equal(isSuccessfulTranslation('Hello world', 'Hello world', 'az'), false);
    assert.equal(isSuccessfulTranslation('Hello world', 'Привет, мир', 'ru'), true);
    assert.equal(
      isSuccessfulTranslation(
        'We look forward to meeting candidates who balance innovation with genuine expertise.',
        'We look forward to meeting candidates who balance innovation with genuine expertise.',
        'ru',
      ),
      false,
    );
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

  it('достаёт длинный английский хвост целиком, не одну фразу', () => {
    const tail = [
      '1Password is proud to be an equal opportunity employer.',
      'We are committed to fostering an inclusive workplace.',
      'We do not discriminate on the basis of race or religion.',
      'Remote work has been part of our culture since 2005.',
      'Please contact nextbit@agilebits.com for accommodations.',
    ].join(' ');
    const leftovers = leftoverSourcePieces(`Тебе место здесь. ${tail}`, 'ru');
    assert.ok(leftovers.length >= 1);
    assert.match(leftovers.join(' '), /equal opportunity/);
    assert.match(leftovers.join(' '), /Remote work/);
  });
});

describe('translate errors', () => {
  it('отличает сеть от квоты и прочего', () => {
    assert.equal(isNetworkError(new Error('Network request failed')), true);
    assert.equal(isNetworkError(new Error('timeout')), true);
    assert.equal(isNetworkError(new Error('HTTP 500')), false);
    assert.equal(translateFailCode(new Error('Network request failed')), 'network');
    assert.equal(translateFailCode(new Error('translate-empty')), 'unavailable');
  });
});

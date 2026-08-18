import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { parseFontSize, scaleFont, monoAdvance } from './fontScale';

describe('fontScale', () => {
  it('принимает только три размера', () => {
    assert.equal(parseFontSize('sm'), 'sm');
    assert.equal(parseFontSize('md'), 'md');
    assert.equal(parseFontSize('lg'), 'lg');
    assert.equal(parseFontSize('huge'), 'md');
    assert.equal(parseFontSize(null), 'md');
  });

  it('масштабирует кегль', () => {
    assert.equal(scaleFont(16, 1), 16);
    assert.equal(scaleFont(16, 0.88), 14);
    assert.equal(scaleFont(16, 1.18), 19);
  });

  it('считает ширину моноширинной подписи', () => {
    assert.equal(monoAdvance('Workly', 13), Math.ceil(6 * 13 * 0.66));
    assert.equal(monoAdvance('All fields', 13), Math.ceil(10 * 13 * 0.66));
  });
});

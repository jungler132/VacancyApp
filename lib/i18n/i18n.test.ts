import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { az } from './az';
import { en } from './en';
import { t, tokenLabel } from './index';
import { ru, type MsgId } from './ru';

describe('i18n', () => {
  it('держит одинаковые ключи в трёх языках', () => {
    const keys = Object.keys(ru) as MsgId[];
    assert.equal(keys.length, Object.keys(en).length);
    assert.equal(keys.length, Object.keys(az).length);
    for (const key of keys) {
      assert.equal(typeof en[key], 'string');
      assert.equal(typeof az[key], 'string');
      assert.ok(en[key].length > 0, key);
      assert.ok(az[key].length > 0, key);
    }
  });

  it('подставляет переменные', () => {
    assert.equal(t('ru', 'filters.showCount', { count: 12 }), 'Показать 12');
    assert.equal(t('en', 'filters.showCount', { count: 12 }), 'Show 12');
  });

  it('переводит известные токены и оставляет сырой текст', () => {
    assert.equal(tokenLabel('en', 'remote'), 'Remote');
    assert.equal(tokenLabel('az', 'it', ['category']), 'IT');
    assert.equal(tokenLabel('ru', 'HeadHunter'), 'HeadHunter');
  });
});

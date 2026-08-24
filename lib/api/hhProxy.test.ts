import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { hhDirectUrl } from './hhProxy';

describe('hh proxy urls', () => {
  it('собирает поиск с несколькими area', () => {
    const params = new URLSearchParams();
    params.set('text', 'react');
    params.set('page', '0');
    params.append('area', '113');
    params.append('area', '40');
    assert.equal(
      hhDirectUrl('search', params),
      'https://api.hh.ru/vacancies?text=react&page=0&area=113&area=40',
    );
  });

  it('собирает детали по id', () => {
    const params = new URLSearchParams({ id: '12345' });
    assert.equal(hhDirectUrl('details', params), 'https://api.hh.ru/vacancies/12345');
  });
});

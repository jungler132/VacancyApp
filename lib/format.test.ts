import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { annotateSalary, currencyLabel, formatSalary, salaryAmount } from './format';

describe('formatSalary', () => {
  it('всегда пишет валюту рядом с суммой', () => {
    assert.equal(formatSalary(150000, null, 'RUB'), '150 000 ₽');
    assert.equal(formatSalary(300000, 450000, 'KZT'), '300 000 – 450 000 ₸');
    assert.equal(formatSalary(800, 1200, 'AZN'), '800 – 1 200 ₼');
    assert.equal(formatSalary(2500, null, 'USD'), '2 500 $');
    assert.equal(formatSalary(40000, null, 'eur'), '40 000 €');
  });

  it('понимает алиасы hh и русские названия', () => {
    assert.equal(currencyLabel('RUR'), '₽');
    assert.equal(currencyLabel('руб'), '₽');
    assert.equal(currencyLabel('тенге'), '₸');
    assert.equal(currencyLabel('манат'), '₼');
  });

  it('не дублирует валюту в готовой строке', () => {
    assert.equal(annotateSalary('150 000 ₽', 'RUB'), '150 000 ₽');
    assert.equal(annotateSalary('50000', 'KZT'), '50000 ₸');
    assert.equal(annotateSalary('80 000', 'RUR'), '80 000 ₽');
  });

  it('salaryAmount всё ещё читает число', () => {
    assert.equal(salaryAmount('150 000 ₽'), 150000);
    assert.equal(salaryAmount('300 000 – 450 000 ₸'), 450000);
  });
});

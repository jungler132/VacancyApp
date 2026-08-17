import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { annotateSalary, composeSalary, currencyLabel, formatSalary, jobFacts, jobTags, salaryAmount } from './format';

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

  it('composeSalary добавляет валюту к числу с формы', () => {
    assert.equal(composeSalary('150000', 'RUB'), '150 000 ₽');
    assert.equal(composeSalary('150 000', 'AZN'), '150 000 ₼');
    assert.equal(composeSalary('150 000 ₽', 'RUB'), '150 000 ₽');
    assert.equal(composeSalary('', 'RUB'), undefined);
  });
});

describe('jobFacts', () => {
  it('берёт опыт и график из полей источника', () => {
    const facts = jobFacts({
      sourceName: 'HeadHunter',
      title: 'Курьер',
      location: 'Баку',
      remote: false,
      employment: 'Полная занятость',
      experience: 'Нет опыта',
      schedule: 'Полный день',
      excerpt: 'Доставка по городу',
    });
    const map = Object.fromEntries(facts.map((item) => [item.label, item.value]));
    assert.equal(map['Источник'], 'HeadHunter');
    assert.equal(map['Формат'], 'Офис');
    assert.equal(map['Занятость'], 'Полная занятость');
    assert.equal(map['График'], 'Полный день');
    assert.equal(map['Опыт'], 'Без опыта');
    assert.equal(map['Язык'], 'RU');
  });

  it('угадывает junior и удалёнку из текста, если API молчит', () => {
    const facts = jobFacts({
      sourceName: 'RemoteOK',
      title: 'Junior React developer',
      location: 'Worldwide',
      remote: true,
      excerpt: 'Remote role for a junior engineer',
    });
    const map = Object.fromEntries(facts.map((item) => [item.label, item.value]));
    assert.equal(map['Формат'], 'Удалённо');
    assert.equal(map['Опыт'], 'Junior / без опыта');
    assert.equal(map['Язык'], 'EN');
    assert.deepEqual(jobTags({ title: 'Junior React developer', remote: true }), ['Удалённо', 'Junior / без опыта']);
  });
});

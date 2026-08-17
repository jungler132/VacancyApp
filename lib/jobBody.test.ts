import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { htmlToText, stripHtml } from './format';
import { parseJobBody } from './jobBody';

describe('htmlToText', () => {
  it('сохраняет абзацы и пункты списка', () => {
    const text = htmlToText(`
      <h2>Обязанности:</h2>
      <ul>
        <li>Делать отчёты</li>
        <li>Согласовывать сметы</li>
      </ul>
      <p>О компании: работаем с 2012 года.</p>
    `);
    assert.match(text, /Обязанности:/);
    assert.match(text, /• Делать отчёты/);
    assert.match(text, /• Согласовывать сметы/);
    assert.match(text, /\n/);
  });

  it('stripHtml по-прежнему склеивает в одну строку для карточек', () => {
    assert.equal(stripHtml('<p>Hello</p><p>World</p>'), 'Hello World');
  });
});

describe('parseJobBody', () => {
  it('разбирает HTML вакансии HH', () => {
    const blocks = parseJobBody(`
      <p><strong>Обязанности:</strong></p>
      <ul><li>Писать код</li><li>Ревьюить MR</li></ul>
      <p><strong>Требования:</strong></p>
      <ul><li>TypeScript</li><li>React Native</li></ul>
      <p><strong>Мы предлагаем:</strong></p>
      <p>Удалёнка и ДМС.</p>
    `);
    const headings = blocks.filter((block) => block.type === 'heading').map((block) => block.text);
    assert.deepEqual(headings, ['Обязанности', 'Требования', 'Мы предлагаем']);
    const lists = blocks.filter((block) => block.type === 'list');
    assert.equal(lists.length, 2);
    assert.deepEqual(lists[0].type === 'list' ? lists[0].items : [], ['Писать код', 'Ревьюить MR']);
  });

  it('восстанавливает кашу без переносов', () => {
    const blocks = parseJobBody(
      'Company overview: Machine Learning Reply provides consulting services in data science. We support clients with customer-specific use cases. Responsibilities : You will design models. You will present results to stakeholders. What we offer you: Very active social program - including training, conferences, team buildings and more Attractive compensation package Interesting projects with customers from different industries Flexible working hours',
    );
    const headings = blocks.filter((block) => block.type === 'heading').map((block) => block.text);
    assert.ok(headings.includes('Company overview'));
    assert.ok(headings.includes('Responsibilities'));
    assert.ok(headings.includes('What we offer you'));
    const offer = blocks.find((block) => block.type === 'list');
    assert.ok(offer && offer.type === 'list' && offer.items.length >= 3);
    assert.ok(offer.items.some((item) => /social program/i.test(item)));
    assert.ok(offer.items.some((item) => /compensation/i.test(item)));
  });

  it('не ломает короткий обычный текст', () => {
    const blocks = parseJobBody('Ищем курьера на полный день. Работа в центре города.');
    assert.equal(blocks.length, 1);
    assert.equal(blocks[0].type, 'paragraph');
  });
});

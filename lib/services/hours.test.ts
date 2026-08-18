import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  composeClock,
  formatServiceHours,
  formatServiceSchedule,
  formatWeekdays,
  normalizeClock,
  parseClock,
  parseWeekdays,
  WEEKDAYS,
} from './hours';

const label = (id: number) => ['', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'][id] ?? String(id);

describe('service hours', () => {
  it('нормализует часы к шагу 5 минут', () => {
    assert.equal(parseClock('9:07').clock, '09:05');
    assert.equal(normalizeClock('18:58'), '19:00');
    assert.equal(composeClock('7', '0'), '07:00');
    assert.equal(normalizeClock('нет'), '09:00');
  });

  it('сжимает дни в диапазоны', () => {
    assert.equal(formatWeekdays([1, 2, 3, 4, 5], label), 'Пн–Пт');
    assert.equal(formatWeekdays([6, 7], label), 'Сб–Вс');
    assert.equal(formatWeekdays([1, 3, 5], label), 'Пн, Ср, Пт');
    assert.equal(formatWeekdays(WEEKDAYS, label, 'каждый день'), 'каждый день');
    assert.equal(formatWeekdays([], label), '');
  });

  it('собирает подпись расписания', () => {
    assert.equal(formatServiceHours('09:00', '18:00'), '09:00–18:00');
    assert.equal(
      formatServiceSchedule({ open: '09:00', close: '18:00', days: [1, 2, 3, 4, 5] }, label, 'каждый день'),
      'Пн–Пт · 09:00–18:00',
    );
  });

  it('читает дни из хранения и отбрасывает мусор', () => {
    assert.deepEqual(parseWeekdays(['1', 2, 2, 9, 'x']), [1, 2]);
    assert.deepEqual(parseWeekdays(undefined), [...WEEKDAYS]);
  });
});

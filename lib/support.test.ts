import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  REPORT_COOLDOWN_MS,
  REPORT_MAX,
  SUPPORT_EMAIL,
  isReportCooldownError,
  reportMailUrl,
  reportUnlockAt,
  reportWaitLabel,
  reportWaitParts,
} from './support';

describe('support report mail', () => {
  it('кладёт причину, id и почту в mailto', () => {
    const url = reportMailUrl(
      { kind: 'offer', id: 'offer:1', title: 'Dam temiri' },
      '  fake photos  ',
      'user@mail.ru',
    );
    assert.ok(url.startsWith(`mailto:${SUPPORT_EMAIL}?`));
    const query = decodeURIComponent(url.slice(url.indexOf('?') + 1));
    assert.match(query, /fake photos/);
    assert.match(query, /type: offer/);
    assert.match(query, /id: offer:1/);
    assert.match(query, /from: user@mail.ru/);
  });

  it('режет текст до лимита', () => {
    const url = reportMailUrl({ kind: 'master', id: 'user:1', title: 'A' }, 'x'.repeat(REPORT_MAX + 40));
    const query = decodeURIComponent(url);
    const body = query.slice(query.indexOf('body=') + 5);
    const message = body.split('\n')[0] ?? '';
    assert.equal(message.length, REPORT_MAX);
  });
});

describe('report cooldown', () => {
  it('открывает окно через 24 часа', () => {
    const last = Date.parse('2026-08-19T10:00:00.000Z');
    assert.equal(reportUnlockAt(last, last + REPORT_COOLDOWN_MS - 1), last + REPORT_COOLDOWN_MS);
    assert.equal(reportUnlockAt(last, last + REPORT_COOLDOWN_MS), null);
    assert.equal(reportUnlockAt(null, last), null);
  });

  it('округляет ожидание вверх до минуты', () => {
    assert.deepEqual(reportWaitParts(1), { hours: 0, minutes: 1 });
    assert.deepEqual(reportWaitParts(90 * 60_000), { hours: 1, minutes: 30 });
    assert.deepEqual(reportWaitParts(24 * 60 * 60_000), { hours: 24, minutes: 0 });
  });

  it('собирает подпись без лишних нулей', () => {
    const hour = (count: number) => `${count}h`;
    const min = (count: number) => `${count}m`;
    assert.equal(reportWaitLabel(45_000, hour, min), '1m');
    assert.equal(reportWaitLabel(3 * 60 * 60_000, hour, min), '3h');
    assert.equal(reportWaitLabel(90 * 60_000, hour, min), '1h 30m');
  });

  it('узнаёт отказ базы по тексту', () => {
    assert.equal(isReportCooldownError('report_cooldown'), true);
    assert.equal(isReportCooldownError('duplicate key'), false);
  });
});

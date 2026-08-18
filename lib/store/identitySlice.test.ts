import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import identityReducer, { parseIdentity, savePrefs } from './identitySlice';
import { parseSavedJobs } from './savedSlice';

describe('identity', () => {
  it('по умолчанию ищет работу и не открыт для заказов', () => {
    assert.deepEqual(parseIdentity(null), {
      seeking: true,
      available: false,
      title: '',
      format: 'any',
    });
    assert.equal(parseIdentity({ seeking: false, available: true }).seeking, false);
    assert.equal(parseIdentity({ seeking: false, available: true }).available, true);
  });

  it('savePrefs пишет статус вместе с должностью и форматом', () => {
    const next = identityReducer(
      undefined,
      savePrefs({ title: 'Dev', format: 'remote', seeking: false, available: true }),
    );
    assert.equal(next.title, 'Dev');
    assert.equal(next.format, 'remote');
    assert.equal(next.seeking, false);
    assert.equal(next.available, true);
  });
});

describe('saved pipeline persist', () => {
  it('отбрасывает неизвестные статусы и читает даты', () => {
    const parsed = parseSavedJobs(
      JSON.stringify({
        items: [{ id: '1', title: 'Dev' }],
        statuses: { '1': 'interview', '2': 'nope' },
        statusAt: { '1': '2026-08-01T00:00:00.000Z' },
      }),
    );
    assert.equal(parsed.statuses['1'], 'interview');
    assert.equal(parsed.statuses['2'], undefined);
    assert.equal(parsed.statusAt['1'], '2026-08-01T00:00:00.000Z');
  });
});

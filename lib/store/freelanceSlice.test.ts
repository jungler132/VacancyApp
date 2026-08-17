import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import reducer, { OWN_PROFILE_ID, parseFreelance, saveProfile, upsertOffer } from './freelanceSlice';

describe('freelance persist', () => {
  it('отбрасывает профиль без имени и кривые услуги', () => {
    const parsed = parseFreelance({
      profile: { displayName: '  ', phone: '1' },
      offers: [{ title: '', kind: 'beauty' }, { title: 'Маникюр', kind: 'nope' }, { title: 'Маникюр', kind: 'beauty' }],
    });
    assert.equal(parsed.profile, null);
    assert.equal(parsed.offers.length, 1);
    assert.equal(parsed.offers[0]?.title, 'Маникюр');
  });

  it('пишет свой профиль со стабильным id', () => {
    const saved = reducer(
      { profile: null, offers: [], ready: true },
      saveProfile({
        id: 'other',
        displayName: 'Мария',
        bio: 'Уборка',
        email: 'm@example.com',
        phone: '+7 900',
        kinds: ['cleaning'],
        hours: { open: '10:00', close: '18:00' },
        updatedAt: '2020-01-01T00:00:00.000Z',
      }),
    );
    assert.equal(saved.profile?.id, OWN_PROFILE_ID);
    assert.equal(saved.profile?.displayName, 'Мария');
  });

  it('обновляет услугу по id и не плодит копии', () => {
    const first = reducer(
      { profile: null, offers: [], ready: true },
      upsertOffer({
        id: 'offer:1',
        profileId: 'x',
        title: 'Уборка квартиры',
        description: '2 часа',
        currency: 'RUB',
        images: [],
        kind: 'cleaning',
        updatedAt: '2020-01-01T00:00:00.000Z',
      }),
    );
    const second = reducer(
      first,
      upsertOffer({
        id: 'offer:1',
        profileId: 'x',
        title: 'Уборка квартиры и окон',
        description: '3 часа',
        currency: 'RUB',
        images: ['file://a.jpg'],
        kind: 'cleaning',
        updatedAt: '2020-01-01T00:00:00.000Z',
      }),
    );
    assert.equal(second.offers.length, 1);
    assert.equal(second.offers[0]?.title, 'Уборка квартиры и окон');
    assert.equal(second.offers[0]?.profileId, OWN_PROFILE_ID);
  });
});

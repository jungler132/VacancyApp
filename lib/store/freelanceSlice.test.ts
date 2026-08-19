import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import reducer, { OWN_PROFILE_ID, applyRemoteMedia, parseFreelance, saveProfile, upsertOffer } from './freelanceSlice';

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
        photos: [],
        customKinds: [],
        hours: { open: '10:00', close: '18:00', days: [1, 2, 3, 4, 5] },
        updatedAt: '2020-01-01T00:00:00.000Z',
      }),
    );
    assert.equal(saved.profile?.id, OWN_PROFILE_ID);
    assert.equal(saved.profile?.displayName, 'Мария');
    assert.deepEqual(saved.profile?.hours.days, [1, 2, 3, 4, 5]);
  });

  it('для старого профиля без дней считает все дни рабочими', () => {
    const parsed = parseFreelance({
      profile: { displayName: 'Мария', kinds: ['cleaning'], hours: { open: '10:00', close: '18:00' } },
      offers: [],
    });
    assert.deepEqual(parsed.profile?.hours.days, [1, 2, 3, 4, 5, 6, 7]);
    assert.equal(parsed.profile?.hours.open, '10:00');
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

  it('хранит свою категорию и премиум услуги', () => {
    const saved = reducer(
      { profile: null, offers: [], ready: true },
      upsertOffer({
        id: 'offer:2',
        profileId: 'x',
        title: 'Сварка',
        description: '',
        currency: 'RUB',
        images: [],
        kind: 'other',
        customKind: 'Сварка',
        featured: true,
        updatedAt: '2020-01-01T00:00:00.000Z',
      }),
    );
    assert.equal(saved.offers[0]?.customKind, 'Сварка');
    assert.equal(saved.offers[0]?.featured, true);
  });

  it('подставляет https-фото без смены updatedAt', () => {
    const withOffer = reducer(
      {
        profile: {
          id: OWN_PROFILE_ID,
          displayName: 'Мария',
          bio: '',
          email: '',
          phone: '',
          kinds: [],
          photos: ['file://a.jpg'],
          avatarUri: 'file://a.jpg',
          customKinds: [],
          hours: { open: '09:00', close: '18:00', days: [1, 2, 3, 4, 5] },
          updatedAt: '2020-01-01T00:00:00.000Z',
        },
        offers: [
          {
            id: 'offer:1',
            profileId: OWN_PROFILE_ID,
            title: 'Уборка',
            description: '',
            currency: 'RUB',
            images: ['file://b.jpg'],
            kind: 'cleaning',
            updatedAt: '2020-01-01T00:00:00.000Z',
          },
        ],
        ready: true,
      },
      applyRemoteMedia({
        avatarUri: 'https://cdn.example/a.jpg',
        offers: { 'offer:1': ['https://cdn.example/b.jpg'] },
      }),
    );
    assert.equal(withOffer.profile?.updatedAt, '2020-01-01T00:00:00.000Z');
    assert.equal(withOffer.profile?.avatarUri, 'https://cdn.example/a.jpg');
    assert.equal(withOffer.offers[0]?.updatedAt, '2020-01-01T00:00:00.000Z');
    assert.deepEqual(withOffer.offers[0]?.images, ['https://cdn.example/b.jpg']);
  });
});

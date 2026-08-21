import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { catalogFromRows, PUBLIC_PROFILE_COLUMNS, withoutMissingProfileColumn, type OfferRow, type ProfileRow } from './rows';

describe('public profile columns', () => {
  it('не включает account_state', () => {
    const cols = PUBLIC_PROFILE_COLUMNS.split(',');
    assert.equal(cols.includes('account_state'), false);
    assert.ok(cols.includes('display_name'));
    assert.ok(cols.includes('avatar_url'));
    assert.ok(cols.includes('company_name'));
  });

  it('выбрасывает отсутствующий city_id из select', () => {
    const next = withoutMissingProfileColumn(
      PUBLIC_PROFILE_COLUMNS,
      'column profiles.city_id does not exist',
    );
    assert.ok(next);
    assert.equal(next.includes('city_id'), false);
    assert.ok(next.includes('avatar_url'));
  });
});

function offer(partial: Partial<OfferRow> & Pick<OfferRow, 'id' | 'user_id' | 'title'>): OfferRow {
  return {
    description: '',
    price: null,
    currency: 'RUB',
    images: [],
    address: null,
    phone: null,
    kind: 'beauty',
    custom_kind: null,
    featured: false,
    updated_at: '2026-01-01T00:00:00.000Z',
    ...partial,
  };
}

function profile(partial: Partial<ProfileRow> & Pick<ProfileRow, 'id'>): ProfileRow {
  return {
    display_name: '',
    bio: '',
    avatar_url: null,
    email: '',
    phone: '',
    kinds: [],
    custom_kinds: [],
    address: null,
    hours_open: '09:00',
    hours_close: '18:00',
    hours_days: [1, 2, 3, 4, 5],
    seeking: true,
    available: false,
    seek_title: '',
    seek_format: 'any',
    updated_at: '2026-01-01T00:00:00.000Z',
    ...partial,
  };
}

describe('catalogFromRows', () => {
  it('берёт услуги даже без имени в профиле', () => {
    const masters = catalogFromRows(
      [profile({ id: 'dc3cfa72-cdac-482c-a27f-d32aaaaaaa' })],
      [offer({ id: 'offer:manicure', user_id: 'dc3cfa72-cdac-482c-a27f-d32aaaaaaa', title: 'Маникюр/Педикюр' })],
    );
    assert.equal(masters.length, 1);
    assert.equal(masters[0]?.displayName, 'Маникюр/Педикюр');
    assert.equal(masters[0]?.offers.length, 1);
  });

  it('показывает оффер без строки профиля', () => {
    const masters = catalogFromRows(
      [],
      [offer({ id: 'offer:dev', user_id: 'ead4c0d1-0588-41cf-933d-c7aaaaaaa', title: 'App developing', kind: 'it_help' })],
    );
    assert.equal(masters.length, 1);
    assert.equal(masters[0]?.id, 'user:ead4c0d1-0588-41cf-933d-c7aaaaaaa');
    assert.equal(masters[0]?.displayName, 'App developing');
  });

  it('не теряет чужие услуги, если своих много', () => {
    const masters = catalogFromRows(
      [profile({ id: 'u1', display_name: 'Анна' }), profile({ id: 'u2', display_name: 'Dev' })],
      [
        offer({ id: 'offer:a', user_id: 'u1', title: 'Маникюр' }),
        offer({ id: 'offer:b', user_id: 'u2', title: 'App developing', kind: 'it_help' }),
      ],
    );
    assert.equal(masters.length, 2);
    assert.deepEqual(
      masters.map((item) => item.offers[0]?.title).sort(),
      ['App developing', 'Маникюр'],
    );
  });

  it('прячет архив', () => {
    const masters = catalogFromRows(
      [profile({ id: 'u1', display_name: 'Анна' })],
      [offer({ id: 'offer:old', user_id: 'u1', title: 'Старое', archived: true })],
    );
    assert.equal(masters.length, 0);
  });

  it('не подменяет аватарку фотографией услуги', () => {
    const masters = catalogFromRows(
      [profile({ id: 'u1', display_name: 'Анна', avatar_url: 'https://cdn.example/avatar.jpg' })],
      [
        offer({
          id: 'offer:a',
          user_id: 'u1',
          title: 'Маникюр',
          images: ['https://cdn.example/work.jpg'],
        }),
      ],
    );
    assert.equal(masters[0]?.avatarUri, 'https://cdn.example/avatar.jpg');
  });

  it('без avatar_url не берёт фото услуги', () => {
    const masters = catalogFromRows(
      [profile({ id: 'u1', display_name: 'Анна', avatar_url: null })],
      [
        offer({
          id: 'offer:a',
          user_id: 'u1',
          title: 'Маникюр',
          images: ['https://cdn.example/work.jpg'],
        }),
      ],
    );
    assert.equal(masters[0]?.avatarUri, undefined);
  });
});

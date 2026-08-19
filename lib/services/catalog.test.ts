import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { filterServiceMasters, offerKindLabel, prefillOfferContact } from './catalog';
import { SERVICE_KINDS } from './kinds';
import type { ServiceMaster, ServiceOffer } from './types';

const HOURS = { open: '09:00', close: '18:00', days: [1, 2, 3, 4, 5] as const };

function offer(partial: Partial<ServiceOffer> & Pick<ServiceOffer, 'id' | 'title' | 'kind'>): ServiceOffer {
  return {
    profileId: partial.profileId ?? 'm:1',
    description: '',
    currency: 'RUB',
    images: [],
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...partial,
  };
}

function master(partial: Partial<ServiceMaster> & Pick<ServiceMaster, 'id' | 'displayName'>): ServiceMaster {
  return {
    bio: '',
    email: '',
    phone: '',
    photos: [],
    kinds: [],
    customKinds: [],
    hours: { open: HOURS.open, close: HOURS.close, days: [...HOURS.days] },
    updatedAt: '2026-01-01T00:00:00.000Z',
    offers: [],
    ...partial,
  };
}

const FIXTURES: ServiceMaster[] = [
  master({
    id: 'm:anna',
    displayName: 'Анна',
    kinds: ['beauty'],
    offers: [offer({ id: 'o:manicure', profileId: 'm:anna', title: 'Маникюр', kind: 'beauty' })],
  }),
  master({
    id: 'm:igor',
    displayName: 'Игорь',
    kinds: ['repair'],
    offers: [offer({ id: 'o:light', profileId: 'm:igor', title: 'Люстра chandelier', kind: 'repair' })],
  }),
  master({
    id: 'm:leyla',
    displayName: 'Лейла',
    kinds: ['tutoring'],
  }),
];

describe('services catalog', () => {
  it('держит уникальные id мастеров и услуг', () => {
    const profileIds = FIXTURES.map((item) => item.id);
    assert.equal(new Set(profileIds).size, profileIds.length);
    const offerIds = FIXTURES.flatMap((item) => item.offers.map((item) => item.id));
    assert.equal(new Set(offerIds).size, offerIds.length);
    assert.ok(SERVICE_KINDS.length >= 8);
  });

  it('фильтрует по виду услуги', () => {
    const beauty = filterServiceMasters(FIXTURES, '', 'beauty');
    assert.equal(beauty.length, 1);
    assert.equal(beauty[0]?.id, 'm:anna');
  });

  it('ищет по имени и тексту услуги', () => {
    const byName = filterServiceMasters(FIXTURES, 'лейла', 'all');
    assert.equal(byName[0]?.id, 'm:leyla');
    const byOffer = filterServiceMasters(FIXTURES, 'люстр', 'all');
    assert.equal(byOffer[0]?.id, 'm:igor');
    const byKindEn = filterServiceMasters(FIXTURES, 'beauty', 'all');
    assert.equal(byKindEn[0]?.id, 'm:anna');
    const byOfferEn = filterServiceMasters(FIXTURES, 'chandelier', 'all');
    assert.equal(byOfferEn[0]?.id, 'm:igor');
  });

  it('ищет по своей категории', () => {
    const byCustom = filterServiceMasters(
      FIXTURES.map((item, index) =>
        index === 0
          ? { ...item, customKinds: ['Сварка'], offers: item.offers.map((row) => ({ ...row, customKind: 'Сварка' })) }
          : item,
      ),
      'сварка',
      'all',
    );
    assert.equal(byCustom[0]?.id, FIXTURES[0]?.id);
  });

  it('подписывает услугу своей категорией', () => {
    assert.equal(offerKindLabel({ kind: 'other', customKind: 'Сварка' }, (id) => id), 'Сварка');
    assert.equal(offerKindLabel({ kind: 'repair' }, (id) => id), 'repair');
  });

  it('берёт адрес и телефон из профиля если в услуге пусто', () => {
    const fromProfile = prefillOfferContact(undefined, { address: 'Zaqatala', phone: '+994' });
    assert.equal(fromProfile.address, 'Zaqatala');
    assert.equal(fromProfile.phone, '+994');
    const own = prefillOfferContact({ address: 'Баку', phone: '' }, { address: 'Zaqatala', phone: '+994' });
    assert.equal(own.address, 'Баку');
    assert.equal(own.phone, '+994');
  });
});

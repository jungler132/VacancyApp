import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { filterServiceMasters, mergeCatalogMasters, offerKindLabel, prefillOfferContact } from './catalog';
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

  it('фильтрует мастеров по городу', () => {
    const withCity = [
      { ...FIXTURES[0], cityId: 'baku' },
      { ...FIXTURES[1], cityId: 'moscow' },
    ];
    const baku = filterServiceMasters(withCity, '', 'all', 'baku');
    assert.equal(baku.length, 1);
    assert.equal(baku[0]?.id, 'm:anna');
  });

  it('подписывает услугу своей категорией', () => {
    assert.equal(offerKindLabel({ kind: 'other', customKind: 'Сварка' }, (id) => id), 'Сварка');
    assert.equal(offerKindLabel({ kind: 'repair' }, (id) => id), 'repair');
  });

  it('берёт адрес и телефон из профиля если в услуге пусто', () => {
    const fromProfile = prefillOfferContact(undefined, { address: 'Zaqatala', phone: '+994', cityId: 'zaqatala' });
    assert.equal(fromProfile.address, 'Zaqatala');
    assert.equal(fromProfile.phone, '+994');
    assert.equal(fromProfile.cityId, 'zaqatala');
    const own = prefillOfferContact({ address: 'Баку', phone: '' }, { address: 'Zaqatala', phone: '+994' });
    assert.equal(own.address, 'Баку');
    assert.equal(own.phone, '+994');
  });

  it('прячет архивные услуги из каталога', () => {
    const masters = [
      master({
        id: 'm:anna',
        displayName: 'Анна',
        kinds: ['beauty'],
        offers: [
          offer({
            id: 'o:old',
            profileId: 'm:anna',
            title: 'Старый маникюр archivedonly',
            kind: 'beauty',
            archived: true,
          }),
          offer({ id: 'o:live', profileId: 'm:anna', title: 'Маникюр', kind: 'beauty' }),
        ],
      }),
    ];
    const visible = filterServiceMasters(masters, '', 'all');
    assert.deepEqual(visible[0]?.offers.map((item) => item.id), ['o:live']);
    const hidden = filterServiceMasters(masters, 'archivedonly', 'all');
    assert.equal(hidden.length, 0);
  });

  it('гостю и залогиненному показывает все удалённые услуги', () => {
    const remote = [
      master({ id: 'user:a', displayName: 'Анна', offers: [offer({ id: 'o1', profileId: 'user:a', title: 'Маникюр', kind: 'beauty' })] }),
      master({ id: 'user:b', displayName: 'Dev', offers: [offer({ id: 'o2', profileId: 'user:b', title: 'App developing', kind: 'it_help' })] }),
    ];
    const guest = mergeCatalogMasters(remote, undefined, () => false);
    assert.equal(guest.length, 2);
    const own = { ...remote[0], mine: true as const };
    const signedIn = mergeCatalogMasters(remote, own, (id) => id === 'user:a');
    assert.equal(signedIn.length, 2);
    assert.equal(signedIn.filter((item) => item.mine).length, 1);
    assert.ok(signedIn.some((item) => item.id === 'user:b'));
  });
});

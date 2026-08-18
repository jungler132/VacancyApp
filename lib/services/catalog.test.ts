import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { filterServiceMasters, offerKindLabel } from './catalog';
import { SEED_MASTERS } from './seed';
import { SERVICE_KINDS } from './kinds';

describe('services catalog', () => {
  it('держит уникальные id мастеров и услуг', () => {
    const profileIds = SEED_MASTERS.map((item) => item.id);
    assert.equal(new Set(profileIds).size, profileIds.length);
    const offerIds = SEED_MASTERS.flatMap((item) => item.offers.map((offer) => offer.id));
    assert.equal(new Set(offerIds).size, offerIds.length);
    assert.ok(SERVICE_KINDS.length >= 8);
  });

  it('фильтрует по виду услуги', () => {
    const beauty = filterServiceMasters(SEED_MASTERS, '', 'beauty');
    assert.equal(beauty.length, 1);
    assert.equal(beauty[0]?.id, 'seed:anna');
  });

  it('ищет по имени и тексту услуги', () => {
    const byName = filterServiceMasters(SEED_MASTERS, 'лейла', 'all');
    assert.equal(byName[0]?.id, 'seed:leyla');
    const byOffer = filterServiceMasters(SEED_MASTERS, 'люстр', 'all');
    assert.equal(byOffer[0]?.id, 'seed:igor');
    const byKindEn = filterServiceMasters(SEED_MASTERS, 'beauty', 'all');
    assert.equal(byKindEn[0]?.id, 'seed:anna');
    const byOfferEn = filterServiceMasters(SEED_MASTERS, 'chandelier', 'all');
    assert.equal(byOfferEn[0]?.id, 'seed:igor');
  });

  it('ищет по своей категории', () => {
    const byCustom = filterServiceMasters(
      SEED_MASTERS.map((item, index) =>
        index === 0
          ? { ...item, customKinds: ['Сварка'], offers: item.offers.map((offer) => ({ ...offer, customKind: 'Сварка' })) }
          : item,
      ),
      'сварка',
      'all',
    );
    assert.equal(byCustom[0]?.id, SEED_MASTERS[0]?.id);
  });

  it('подписывает услугу своей категорией', () => {
    assert.equal(offerKindLabel({ kind: 'other', customKind: 'Сварка' }, (id) => id), 'Сварка');
    assert.equal(offerKindLabel({ kind: 'repair' }, (id) => id), 'repair');
  });
});

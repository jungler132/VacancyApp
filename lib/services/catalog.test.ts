import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { filterServiceMasters } from './catalog';
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
  });
});

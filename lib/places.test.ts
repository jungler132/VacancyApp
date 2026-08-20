import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  CITIES,
  COUNTRIES,
  inferPlaceId,
  isPlaceId,
  locationMatchesPlace,
  matchesPlaceFilter,
  placeContains,
  placeFitsRegion,
  placeLabel,
  searchPlaces,
} from './places';

describe('places', () => {
  it('держит уникальные id', () => {
    const ids = [...COUNTRIES, ...CITIES].map((item) => item.id);
    assert.equal(new Set(ids).size, ids.length);
  });

  it('подписывает город на языке', () => {
    assert.equal(placeLabel('baku', 'ru'), 'Баку');
    assert.equal(placeLabel('baku', 'az'), 'Bakı');
    assert.equal(placeLabel('country:az', 'en'), 'Azerbaijan');
  });

  it('узнаёт город из свободной строки', () => {
    assert.equal(inferPlaceId('Баку, Ясамаль'), 'baku');
    assert.equal(inferPlaceId('Moscow'), 'moscow');
    assert.ok(isPlaceId(inferPlaceId('Azərbaycan') ?? ''));
  });

  it('фильтрует город и страну', () => {
    assert.equal(matchesPlaceFilter('baku', 'Баку', 'baku'), true);
    assert.equal(matchesPlaceFilter('baku', 'Баку', 'country:az'), true);
    assert.equal(matchesPlaceFilter('moscow', 'Москва', 'baku'), false);
    assert.equal(matchesPlaceFilter(undefined, 'Baku downtown', 'baku'), true);
    assert.equal(locationMatchesPlace('Berlin, Germany', 'country:de'), true);
    assert.equal(placeContains('country:az', 'ganja'), true);
    assert.equal(placeFitsRegion('baku', 'az'), true);
    assert.equal(placeFitsRegion('moscow', 'az'), false);
    assert.equal(placeFitsRegion('baku', 'all'), true);
  });

  it('ищет по алиасу', () => {
    const found = searchPlaces('bakı', 'az', 'city');
    assert.ok(found.some((item) => item.id === 'baku'));
  });
});

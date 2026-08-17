import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  DEFAULT_CATALOG_FILTERS,
  JOB_SITES,
  TELEGRAM_GROUPS,
  catalogFiltersActive,
  catalogMatchesFilter,
  catalogMatchesSelection,
  countriesForRegion,
  filterCatalog,
  filterCatalogBySelection,
  groupCatalogByCountry,
  inferCatalogMeta,
} from './telegramGroups';

describe('catalog resources', () => {
  it('держит уникальные id сайтов и каналов', () => {
    const sites = JOB_SITES.map((item) => item.id);
    const channels = TELEGRAM_GROUPS.map((item) => item.id);
    assert.equal(new Set(sites).size, sites.length);
    assert.equal(new Set(channels).size, channels.length);
  });

  it('фильтрует по стране и региону', () => {
    const hh = JOB_SITES.find((item) => item.id === 'hhru');
    const hellojob = JOB_SITES.find((item) => item.id === 'hellojob');
    const stepstone = JOB_SITES.find((item) => item.id === 'stepstone');
    assert.ok(hh && hellojob && stepstone);
    assert.equal(catalogMatchesFilter(hh, 'ru'), true);
    assert.equal(catalogMatchesFilter(hh, 'cis'), true);
    assert.equal(catalogMatchesFilter(hellojob, 'az'), true);
    assert.equal(catalogMatchesFilter(stepstone, 'europe'), true);
    assert.equal(catalogMatchesFilter(stepstone, 'cis'), false);
    assert.equal(filterCatalog(JOB_SITES, 'az').every((item) => item.country === 'az'), true);
  });

  it('фильтрует по выбору региона и страны', () => {
    assert.equal(catalogFiltersActive(DEFAULT_CATALOG_FILTERS), false);
    assert.equal(catalogFiltersActive({ region: 'cis', country: 'all' }), true);
    const hh = JOB_SITES.find((item) => item.id === 'hhru');
    const stepstone = JOB_SITES.find((item) => item.id === 'stepstone');
    assert.ok(hh && stepstone);
    assert.equal(catalogMatchesSelection(hh, { region: 'cis', country: 'all' }), true);
    assert.equal(catalogMatchesSelection(stepstone, { region: 'cis', country: 'all' }), false);
    assert.equal(catalogMatchesSelection(hh, { region: 'cis', country: 'ru' }), true);
    assert.equal(catalogMatchesSelection(hh, { region: 'cis', country: 'az' }), false);
    assert.ok(countriesForRegion('cis').every((item) => item.region === 'cis'));
    const cis = filterCatalogBySelection(JOB_SITES, { region: 'cis', country: 'all' });
    assert.ok(cis.length > 0);
    assert.ok(cis.every((item) => ['az', 'ru', 'ua', 'by', 'kz', 'uz', 'am', 'ge', 'kg', 'md', 'tj'].includes(item.country)));
    const groups = groupCatalogByCountry(cis);
    assert.ok(groups.some((group) => group.id === 'ru'));
    assert.ok(groups.some((group) => group.id === 'az'));
  });

  it('выводит тип охвата и доступ без сети', () => {
    const hh = JOB_SITES.find((item) => item.id === 'hhru');
    const djinni = JOB_SITES.find((item) => item.id === 'djinni');
    const olx = JOB_SITES.find((item) => item.id === 'olx-az');
    const flex = JOB_SITES.find((item) => item.id === 'flexjobs');
    const junior = TELEGRAM_GROUPS.find((item) => item.id === 'young_june');
    assert.ok(hh && djinni && olx && flex && junior);
    assert.equal(inferCatalogMeta(hh).focus, 'all');
    assert.equal(inferCatalogMeta(hh).langs, 'RU');
    assert.equal(inferCatalogMeta(djinni).focus, 'it');
    assert.equal(inferCatalogMeta(olx).focus, 'classifieds');
    assert.equal(inferCatalogMeta(flex).access, 'paid');
    assert.equal(inferCatalogMeta(junior).focus, 'junior');
  });
});

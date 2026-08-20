import { getPlace, type CountryId } from './places';
import type { RegionId } from './types';

const JOOBLE_REGION_LOCATION: Record<RegionId, string> = {
  cis: 'Russia',
  az: 'Azerbaijan',
  europe: 'Germany',
  west: 'United States',
  asia: 'Singapore',
  all: '',
  remote: 'Remote',
};

const ADZUNA_COUNTRY: Partial<Record<CountryId, string>> = {
  de: 'de',
  pl: 'pl',
  gb: 'gb',
  us: 'us',
  ca: 'ca',
  in: 'in',
};

const ADZUNA_REGION_COUNTRIES: Record<RegionId, string[]> = {
  cis: ['pl', 'de'],
  europe: ['de', 'gb', 'fr', 'pl', 'nl'],
  west: ['us', 'ca', 'gb', 'au'],
  asia: ['in', 'sg'],
  all: ['gb', 'us', 'de', 'in'],
  remote: ['gb', 'us'],
  az: [],
};

const TRUDVSEM_REGION: Record<string, string> = {
  moscow: '7700000000000',
  spb: '7800000000000',
  kazan: '1600000000000',
  novosibirsk: '5400000000000',
  yekaterinburg: '6600000000000',
  nn: '5200000000000',
  krasnodar: '2300000000000',
  rostov: '6100000000000',
  samara: '6300000000000',
  ufa: '0200000000000',
  sochi: '2300000000000',
  kaliningrad: '3900000000000',
};

const CIS_COUNTRIES = new Set<CountryId>(['ru', 'by', 'kz', 'uz', 'am', 'kg', 'md', 'ua']);

export type AdzunaTarget = {
  country: string;
  where?: string;
};

export type TrudvsemPlace = { kind: 'all' } | { kind: 'region'; code: string } | { kind: 'skip' };

export function joobleLocation(placeId: string | undefined, region: RegionId): string {
  const place = getPlace(placeId);
  if (place) return place.en;
  return JOOBLE_REGION_LOCATION[region] ?? '';
}

export function joobleLang(placeId: string | undefined, region: RegionId): 'az' | 'ru' | 'en' {
  const country = getPlace(placeId)?.countryId;
  if (country === 'az' || (!country && region === 'az')) return 'az';
  if (country && CIS_COUNTRIES.has(country)) return 'ru';
  if (region === 'cis') return 'ru';
  return 'en';
}

export function joobleCurrency(placeId: string | undefined, region: RegionId): string | undefined {
  const country = getPlace(placeId)?.countryId;
  if (country === 'az') return 'AZN';
  if (country === 'ru') return 'RUB';
  if (country === 'pl') return 'PLN';
  if (country === 'gb') return 'GBP';
  if (country === 'us' || country === 'ca') return 'USD';
  if (country === 'de' || country === 'cz') return 'EUR';
  if (region === 'az') return 'AZN';
  if (region === 'cis') return 'RUB';
  if (region === 'europe') return 'EUR';
  if (region === 'west') return 'USD';
  return undefined;
}

export function adzunaTarget(placeId: string | undefined, region: RegionId, page: number): AdzunaTarget | null {
  const place = getPlace(placeId);
  if (place) {
    const country = ADZUNA_COUNTRY[place.countryId];
    if (!country) return null;
    return place.kind === 'city' ? { country, where: place.en } : { country };
  }
  const countries = ADZUNA_REGION_COUNTRIES[region] ?? [];
  const country = countries[page % countries.length];
  if (!country) return null;
  return { country };
}

export function trudvsemPlace(placeId: string | undefined): TrudvsemPlace {
  if (!placeId) return { kind: 'all' };
  const place = getPlace(placeId);
  if (!place) return { kind: 'all' };
  if (place.countryId !== 'ru') return { kind: 'skip' };
  if (place.kind === 'country') return { kind: 'all' };
  const code = TRUDVSEM_REGION[place.id];
  if (!code) return { kind: 'skip' };
  return { kind: 'region', code };
}

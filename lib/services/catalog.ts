import type { Href } from 'expo-router';

import { composeSalary } from '@/lib/format';
import { APP_LOCALES } from '@/lib/i18n/locale';
import { keyOf, t } from '@/lib/i18n';
import { matchesPlaceFilter, placeLabel } from '@/lib/places';
import type { ServiceKindId, ServiceMaster, ServiceOffer, ServiceProfile } from './types';

export function toServiceMaster(profile: ServiceProfile, offers: ServiceOffer[], mine = false): ServiceMaster {
  const ranked = [...offers].sort(
    (a, b) =>
      Number(Boolean(a.archived)) - Number(Boolean(b.archived)) ||
      Number(Boolean(b.featured)) - Number(Boolean(a.featured)),
  );
  return { ...profile, offers: ranked, mine };
}

export function offerKindLabel(offer: Pick<ServiceOffer, 'kind' | 'customKind'>, labelOf: (id: string) => string): string {
  return offer.customKind?.trim() || labelOf(offer.kind);
}

export function masterHaystack(master: ServiceMaster): string {
  const kinds = master.kinds
    .flatMap((id) => APP_LOCALES.map((locale) => t(locale, keyOf('kind', id))))
    .join(' ');
  const offers = master.offers.map((item) => `${item.title} ${item.description} ${item.customKind ?? ''}`).join(' ');
  return `${master.displayName} ${master.bio} ${master.address ?? ''} ${placeLabel(master.cityId, 'ru')} ${placeLabel(master.cityId, 'en')} ${placeLabel(master.cityId, 'az')} ${kinds} ${master.customKinds.join(' ')} ${offers}`.toLowerCase();
}

export function liveOffers(offers: ServiceOffer[]): ServiceOffer[] {
  return offers.filter((item) => !item.archived);
}

export function mergeCatalogMasters(
  remote: ServiceMaster[],
  own: ServiceMaster | undefined,
  isMine: (id: string) => boolean,
): ServiceMaster[] {
  const out: ServiceMaster[] = [];
  let ownOnRemote = false;
  for (const item of remote) {
    const mine = isMine(item.id);
    if (mine) ownOnRemote = true;
    out.push(mine && own ? { ...own, id: item.id, mine: true } : { ...item, mine });
  }
  if (own && liveOffers(own.offers).length && !ownOnRemote) {
    out.unshift({ ...own, mine: true });
  }
  return out;
}

export function filterServiceMasters(
  masters: ServiceMaster[],
  query: string,
  kind: ServiceKindId | 'all',
  placeId?: string,
): ServiceMaster[] {
  const needle = query.trim().toLowerCase();
  const out: ServiceMaster[] = [];
  for (const master of masters) {
    const catalogOffers = liveOffers(master.offers);
    if (placeId && !matchesPlaceFilter(master.cityId, master.address, placeId) && !catalogOffers.some((item) => matchesPlaceFilter(item.cityId || master.cityId, item.address || master.address, placeId))) {
      continue;
    }
    const offers = kind === 'all' ? catalogOffers : catalogOffers.filter((item) => item.kind === kind);
    const kindsMatch = kind === 'all' || master.kinds.includes(kind) || offers.length > 0;
    if (!kindsMatch) continue;
    const next = { ...master, offers };
    if (needle && !masterHaystack(next).includes(needle)) continue;
    out.push(next);
  }
  return out.sort(
    (a, b) => Number(b.offers.some((item) => item.featured)) - Number(a.offers.some((item) => item.featured)),
  );
}

export function offerContact(offer: ServiceOffer, profile: ServiceProfile): { phone: string; address: string; cityId: string } {
  return prefillOfferContact(offer, profile);
}

export function prefillOfferContact(
  offer: { address?: string; phone?: string; cityId?: string } | undefined,
  profile: { address?: string; phone?: string; cityId?: string } | null | undefined,
): { phone: string; address: string; cityId: string } {
  return {
    phone: offer?.phone?.trim() || profile?.phone?.trim() || '',
    address: offer?.address?.trim() || profile?.address?.trim() || '',
    cityId: offer?.cityId || profile?.cityId || '',
  };
}

export function offerPriceLabel(offer: Pick<ServiceOffer, 'price' | 'currency'>, fallback = 'Цена по договорённости'): string {
  return composeSalary(offer.price, offer.currency) ?? fallback;
}

export function masterHref(id: string): Href {
  return { pathname: '/service/[id]', params: { id } } as unknown as Href;
}

export function offerEditorHref(id: string): Href {
  return { pathname: '/service/offer/[id]', params: { id } } as unknown as Href;
}

export function offerViewHref(id: string): Href {
  return { pathname: '/service/view/[id]', params: { id } } as unknown as Href;
}

export const SERVICE_ME_HREF = '/service/me' as unknown as Href;
export const COMPANY_ME_HREF = '/company/me' as unknown as Href;
export const STATS_HREF = '/stats' as unknown as Href;
export const SAVED_HREF = '/saved' as unknown as Href;
export const PIPELINE_HREF = '/pipeline' as unknown as Href;
export const PIPELINE_ADD_HREF = '/pipeline/add' as unknown as Href;
export const PREFS_HREF = '/prefs' as unknown as Href;
export const TODAY_HREF = '/today' as unknown as Href;
export const SETTINGS_HREF = '/settings' as unknown as Href;
export const PROFILE_HREF = '/profile' as unknown as Href;

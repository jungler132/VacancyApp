import type { AppLocale } from '@/lib/i18n/locale';
import type { RegionId } from '@/lib/types';

export type CountryId =
  | 'az'
  | 'ru'
  | 'by'
  | 'kz'
  | 'uz'
  | 'am'
  | 'ge'
  | 'kg'
  | 'md'
  | 'ua'
  | 'tr'
  | 'de'
  | 'pl'
  | 'cz'
  | 'gb'
  | 'us'
  | 'ca'
  | 'ae'
  | 'in';

export type PlaceKind = 'country' | 'city';

export type Place = {
  id: string;
  kind: PlaceKind;
  countryId: CountryId;
  region: RegionId;
  ru: string;
  en: string;
  az: string;
  aliases: string[];
};

type Names = [ru: string, en: string, az: string];

const COUNTRY_PREFIX = 'country:';

function countryPlaceId(id: CountryId): string {
  return `${COUNTRY_PREFIX}${id}`;
}

function uniq(values: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const value of values) {
    const key = value.trim().toLowerCase();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(key);
  }
  return out;
}

function country(
  id: CountryId,
  region: RegionId,
  names: Names,
  aliases: string[] = [],
): Place {
  return {
    id: countryPlaceId(id),
    kind: 'country',
    countryId: id,
    region,
    ru: names[0],
    en: names[1],
    az: names[2],
    aliases: uniq([...names, ...aliases]),
  };
}

function city(id: string, countryId: CountryId, region: RegionId, names: Names, aliases: string[] = []): Place {
  return {
    id,
    kind: 'city',
    countryId,
    region,
    ru: names[0],
    en: names[1],
    az: names[2],
    aliases: uniq([...names, ...aliases]),
  };
}

export const COUNTRIES: Place[] = [
  country('az', 'az', ['Азербайджан', 'Azerbaijan', 'Azərbaycan'], ['azerbaycan', 'azərbaycan']),
  country('ru', 'cis', ['Россия', 'Russia', 'Rusiya'], ['россия', 'russia', 'rf']),
  country('by', 'cis', ['Беларусь', 'Belarus', 'Belarus'], ['беларус', 'belarus']),
  country('kz', 'cis', ['Казахстан', 'Kazakhstan', 'Qazaxıstan'], ['казахстан', 'kazakhstan']),
  country('uz', 'cis', ['Узбекистан', 'Uzbekistan', 'Özbəkistan'], ['узбекистан', 'uzbekistan']),
  country('am', 'cis', ['Армения', 'Armenia', 'Ermənistan'], ['армения', 'armenia']),
  country('ge', 'cis', ['Грузия', 'Georgia', 'Gürcüstan'], ['грузия', 'georgia', 'sakartvelo']),
  country('kg', 'cis', ['Кыргызстан', 'Kyrgyzstan', 'Qırğızıstan'], ['киргиз', 'кыргыз', 'kyrgyz']),
  country('md', 'cis', ['Молдова', 'Moldova', 'Moldova'], ['молдав', 'moldova']),
  country('ua', 'cis', ['Украина', 'Ukraine', 'Ukrayna'], ['украин', 'ukraine']),
  country('tr', 'asia', ['Турция', 'Turkey', 'Türkiyə'], ['турция', 'turkey', 'türkiye']),
  country('de', 'europe', ['Германия', 'Germany', 'Almaniya'], ['германия', 'germany', 'deutschland']),
  country('pl', 'europe', ['Польша', 'Poland', 'Polşa'], ['польша', 'poland']),
  country('cz', 'europe', ['Чехия', 'Czechia', 'Çexiya'], ['чехия', 'czech']),
  country('gb', 'west', ['Великобритания', 'United Kingdom', 'Britaniya'], ['britain', 'england', 'uk']),
  country('us', 'west', ['США', 'United States', 'ABŞ'], ['usa', 'united states', 'america']),
  country('ca', 'west', ['Канада', 'Canada', 'Kanada'], ['канада', 'canada']),
  country('ae', 'asia', ['ОАЭ', 'UAE', 'BƏƏ'], ['uae', 'emirates', 'оаэ']),
  country('in', 'asia', ['Индия', 'India', 'Hindistan'], ['индия', 'india']),
];

export const CITIES: Place[] = [
  city('baku', 'az', 'az', ['Баку', 'Baku', 'Bakı'], ['bakı', 'baki']),
  city('ganja', 'az', 'az', ['Гянджа', 'Ganja', 'Gəncə'], ['генджа', 'gəncə', 'gence']),
  city('sumqayit', 'az', 'az', ['Сумгаит', 'Sumqayit', 'Sumqayıt'], ['sumqayıt', 'sumgayit']),
  city('mingachevir', 'az', 'az', ['Мингечевир', 'Mingachevir', 'Mingəçevir'], ['mingəçevir']),
  city('lankaran', 'az', 'az', ['Ленкорань', 'Lankaran', 'Lənkəran'], ['lənkəran']),
  city('shirvan', 'az', 'az', ['Ширван', 'Shirvan', 'Şirvan'], ['şirvan']),
  city('nakhchivan', 'az', 'az', ['Нахичевань', 'Nakhchivan', 'Naxçıvan'], ['naxçıvan', 'naxcivan']),
  city('shaki', 'az', 'az', ['Шеки', 'Shaki', 'Şəki'], ['şəki', 'sheki']),
  city('yevlakh', 'az', 'az', ['Евлах', 'Yevlakh', 'Yevlax']),
  city('khachmaz', 'az', 'az', ['Хачмаз', 'Khachmaz', 'Xaçmaz'], ['xaçmaz']),
  city('quba', 'az', 'az', ['Куба', 'Quba', 'Quba']),
  city('zaqatala', 'az', 'az', ['Закаталы', 'Zaqatala', 'Zaqatala']),
  city('shamakhi', 'az', 'az', ['Шемахы', 'Shamakhi', 'Şamaxı'], ['şamaxı']),
  city('gabala', 'az', 'az', ['Габала', 'Gabala', 'Qəbələ'], ['qəbələ', 'qabala']),
  city('barda', 'az', 'az', ['Барда', 'Barda', 'Bərdə'], ['bərdə']),
  city('tovuz', 'az', 'az', ['Товуз', 'Tovuz', 'Tovuz']),
  city('shamkir', 'az', 'az', ['Шамкир', 'Shamkir', 'Şəmkir'], ['şəmkir']),
  city('khirdalan', 'az', 'az', ['Хырдалан', 'Khirdalan', 'Xırdalan'], ['xırdalan']),
  city('shusha', 'az', 'az', ['Шуша', 'Shusha', 'Şuşa'], ['şuşa']),

  city('moscow', 'ru', 'cis', ['Москва', 'Moscow', 'Moskva'], ['москва', 'msk']),
  city('spb', 'ru', 'cis', ['Санкт-Петербург', 'Saint Petersburg', 'Sankt-Peterburq'], ['питер', 'петербург', 'spb']),
  city('kazan', 'ru', 'cis', ['Казань', 'Kazan', 'Kazan']),
  city('novosibirsk', 'ru', 'cis', ['Новосибирск', 'Novosibirsk', 'Novosibirsk']),
  city('yekaterinburg', 'ru', 'cis', ['Екатеринбург', 'Yekaterinburg', 'Yekaterinburq']),
  city('nn', 'ru', 'cis', ['Нижний Новгород', 'Nizhny Novgorod', 'Nijni Novqorod']),
  city('krasnodar', 'ru', 'cis', ['Краснодар', 'Krasnodar', 'Krasnodar']),
  city('rostov', 'ru', 'cis', ['Ростов-на-Дону', 'Rostov-on-Don', 'Rostov']),
  city('samara', 'ru', 'cis', ['Самара', 'Samara', 'Samara']),
  city('ufa', 'ru', 'cis', ['Уфа', 'Ufa', 'Ufa']),
  city('sochi', 'ru', 'cis', ['Сочи', 'Sochi', 'Soçi']),
  city('kaliningrad', 'ru', 'cis', ['Калининград', 'Kaliningrad', 'Kalininqrad']),

  city('minsk', 'by', 'cis', ['Минск', 'Minsk', 'Minsk']),
  city('gomel', 'by', 'cis', ['Гомель', 'Gomel', 'Qomel']),
  city('brest', 'by', 'cis', ['Брест', 'Brest', 'Brest']),

  city('almaty', 'kz', 'cis', ['Алматы', 'Almaty', 'Almatı']),
  city('astana', 'kz', 'cis', ['Астана', 'Astana', 'Astana'], ['nur-sultan', 'нур-султан']),
  city('shymkent', 'kz', 'cis', ['Шымкент', 'Shymkent', 'Şymkent']),

  city('tashkent', 'uz', 'cis', ['Ташкент', 'Tashkent', 'Daşkənd']),
  city('samarkand', 'uz', 'cis', ['Самарканд', 'Samarkand', 'Səmərqənd']),

  city('yerevan', 'am', 'cis', ['Ереван', 'Yerevan', 'İrəvan']),
  city('tbilisi', 'ge', 'cis', ['Тбилиси', 'Tbilisi', 'Tbilisi']),
  city('batumi', 'ge', 'cis', ['Батуми', 'Batumi', 'Batumi']),
  city('bishkek', 'kg', 'cis', ['Бишкек', 'Bishkek', 'Bişkek']),
  city('chisinau', 'md', 'cis', ['Кишинёв', 'Chisinau', 'Kişinyov']),
  city('kyiv', 'ua', 'cis', ['Киев', 'Kyiv', 'Kiyev'], ['киев', 'kiev']),
  city('odesa', 'ua', 'cis', ['Одесса', 'Odesa', 'Odessa']),
  city('lviv', 'ua', 'cis', ['Львов', 'Lviv', 'Lvov']),

  city('istanbul', 'tr', 'asia', ['Стамбул', 'Istanbul', 'İstanbul']),
  city('ankara', 'tr', 'asia', ['Анкара', 'Ankara', 'Ankara']),
  city('izmir', 'tr', 'asia', ['Измир', 'Izmir', 'İzmir']),
  city('antalya', 'tr', 'asia', ['Анталья', 'Antalya', 'Antalya']),

  city('berlin', 'de', 'europe', ['Берлин', 'Berlin', 'Berlin']),
  city('munich', 'de', 'europe', ['Мюнхен', 'Munich', 'Münxen'], ['мюнхен', 'muenchen']),
  city('hamburg', 'de', 'europe', ['Гамбург', 'Hamburg', 'Hamburq']),
  city('frankfurt', 'de', 'europe', ['Франкфурт', 'Frankfurt', 'Frankfurt']),
  city('warsaw', 'pl', 'europe', ['Варшава', 'Warsaw', 'Varşava']),
  city('krakow', 'pl', 'europe', ['Краков', 'Krakow', 'Krakov']),
  city('prague', 'cz', 'europe', ['Прага', 'Prague', 'Praqa']),

  city('london', 'gb', 'west', ['Лондон', 'London', 'London']),
  city('manchester', 'gb', 'west', ['Манчестер', 'Manchester', 'Mançester']),
  city('newyork', 'us', 'west', ['Нью-Йорк', 'New York', 'Nyu-York']),
  city('losangeles', 'us', 'west', ['Лос-Анджелес', 'Los Angeles', 'Los-Anceles']),
  city('chicago', 'us', 'west', ['Чикаго', 'Chicago', 'Çikaqo']),
  city('austin', 'us', 'west', ['Остин', 'Austin', 'Ostin']),
  city('seattle', 'us', 'west', ['Сиэтл', 'Seattle', 'Sietl']),
  city('toronto', 'ca', 'west', ['Торонто', 'Toronto', 'Toronto']),
  city('vancouver', 'ca', 'west', ['Ванкувер', 'Vancouver', 'Vankuver']),

  city('dubai', 'ae', 'asia', ['Дубай', 'Dubai', 'Dubay']),
  city('abudhabi', 'ae', 'asia', ['Абу-Даби', 'Abu Dhabi', 'Əbu-Dabi']),
  city('bengaluru', 'in', 'asia', ['Бангалор', 'Bengaluru', 'Benqaluru'], ['bangalore']),
  city('mumbai', 'in', 'asia', ['Мумбаи', 'Mumbai', 'Mumbai']),
  city('delhi', 'in', 'asia', ['Дели', 'Delhi', 'Dehli']),
];

const BY_ID = new Map<string, Place>();
for (const item of [...COUNTRIES, ...CITIES]) BY_ID.set(item.id, item);

export function countryPlace(id: CountryId): string {
  return countryPlaceId(id);
}

export function getPlace(id?: string | null): Place | undefined {
  if (!id) return undefined;
  return BY_ID.get(id);
}

export function isPlaceId(id: string): boolean {
  return BY_ID.has(id);
}

export function asPlaceId(value: unknown): string | undefined {
  return typeof value === 'string' && isPlaceId(value) ? value : undefined;
}

export function isCountryPlaceId(id: string): boolean {
  return id.startsWith(COUNTRY_PREFIX) && BY_ID.has(id);
}

export function placeLabel(id: string | undefined, locale: AppLocale): string {
  const place = getPlace(id);
  if (!place) return '';
  return place[locale] || place.ru;
}

export function placeFitsRegion(id: string, region: RegionId): boolean {
  if (region === 'all' || region === 'remote') return true;
  const place = getPlace(id);
  return place ? place.region === region : false;
}

export function citiesOf(countryId: CountryId): Place[] {
  return CITIES.filter((item) => item.countryId === countryId);
}

export function countriesForRegion(region: RegionId): Place[] {
  if (region === 'all' || region === 'remote') return COUNTRIES;
  return COUNTRIES.filter((item) => item.region === region);
}

export function citiesForRegion(region: RegionId): Place[] {
  if (region === 'all' || region === 'remote') return CITIES;
  return CITIES.filter((item) => item.region === region);
}

function hayOf(place: Place): string {
  return place.aliases.join(' ');
}

export function searchPlaces(query: string, region: RegionId = 'all', kind?: PlaceKind): Place[] {
  const needle = query.trim().toLowerCase();
  const pool = kind === 'country' ? countriesForRegion(region) : kind === 'city' ? citiesForRegion(region) : [...countriesForRegion(region), ...citiesForRegion(region)];
  if (!needle) return pool;
  return pool.filter((item) => hayOf(item).includes(needle));
}

export function suggestedPlaces(region: RegionId, selectedId?: string, query = '', allowCountry = true): Place[] {
  const selected = getPlace(selectedId);
  if (query.trim()) {
    const found = searchPlaces(query, region);
    return allowCountry ? found.slice(0, 16) : found.filter((item) => item.kind === 'city').slice(0, 16);
  }
  if (selected?.kind === 'country') {
    return citiesOf(selected.countryId).slice(0, 12);
  }
  if (selected?.kind === 'city') {
    return citiesOf(selected.countryId).slice(0, 12);
  }
  const countries = allowCountry ? countriesForRegion(region).slice(0, 8) : [];
  const cities = citiesForRegion(region).slice(0, allowCountry ? 8 : 16);
  return [...countries, ...cities];
}

function textMatchesPlace(hay: string, place: Place): boolean {
  if (!hay.trim()) return false;
  return place.aliases.some((alias) => (alias.length <= 2 ? hay === alias : hay.includes(alias)));
}

export function inferPlaceId(location?: string | null): string | undefined {
  const hay = (location ?? '').trim().toLowerCase();
  if (!hay) return undefined;
  let best: Place | undefined;
  for (const place of CITIES) {
    if (!textMatchesPlace(hay, place)) continue;
    if (!best || place.ru.length > best.ru.length) best = place;
  }
  if (best) return best.id;
  for (const place of COUNTRIES) {
    if (textMatchesPlace(hay, place)) return place.id;
  }
  return undefined;
}

export function placeContains(filterId: string, itemId?: string | null): boolean {
  if (!itemId) return false;
  if (filterId === itemId) return true;
  const filter = getPlace(filterId);
  const item = getPlace(itemId);
  if (!filter || !item) return false;
  return filter.kind === 'country' && item.countryId === filter.countryId;
}

export function locationMatchesPlace(location: string | undefined, placeId: string): boolean {
  const place = getPlace(placeId);
  if (!place) return true;
  const hay = (location ?? '').trim().toLowerCase();
  if (place.kind === 'city') return textMatchesPlace(hay, place);
  if (textMatchesPlace(hay, place)) return true;
  return citiesOf(place.countryId).some((cityPlace) => textMatchesPlace(hay, cityPlace));
}

export function matchesPlaceFilter(
  placeId: string | undefined,
  location: string | undefined,
  filterId?: string | null,
): boolean {
  if (!filterId) return true;
  if (placeContains(filterId, placeId)) return true;
  return locationMatchesPlace(location, filterId);
}

export function formatPlaceLine(
  locale: AppLocale,
  cityId?: string,
  address?: string,
): string {
  const city = placeLabel(cityId, locale);
  const street = (address ?? '').trim();
  if (city && street && street.toLowerCase() !== city.toLowerCase()) return `${city} · ${street}`;
  return city || street;
}

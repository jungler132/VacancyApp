import type { CategoryId, RegionId } from './types';

export const REGIONS: { id: RegionId; label: string }[] = [
  { id: 'all', label: 'Все' },
  { id: 'cis', label: 'СНГ' },
  { id: 'europe', label: 'Европа' },
  { id: 'west', label: 'Запад' },
  { id: 'asia', label: 'Азия' },
  { id: 'remote', label: 'Удалёнка' },
];

export const CATEGORIES: {
  id: CategoryId;
  label: string;
  icon: string;
  ru: string;
  en: string;
}[] = [
  { id: 'all', label: 'Все сферы', icon: 'view-grid-outline', ru: '', en: '' },
  { id: 'sales', label: 'Продажи', icon: 'cart-outline', ru: 'продавец менеджер по продажам', en: 'sales retail shop assistant' },
  { id: 'medicine', label: 'Медицина', icon: 'medical-bag', ru: 'врач медсестра фармацевт', en: 'nurse doctor healthcare medical' },
  { id: 'logistics', label: 'Логистика', icon: 'truck-outline', ru: 'водитель курьер склад логист', en: 'driver warehouse logistics courier' },
  { id: 'construction', label: 'Стройка', icon: 'hammer-wrench', ru: 'строитель сварщик разнорабочий', en: 'construction welder carpenter electrician' },
  { id: 'education', label: 'Образование', icon: 'school-outline', ru: 'учитель преподаватель воспитатель', en: 'teacher tutor education school' },
  { id: 'hospitality', label: 'Общепит', icon: 'silverware-fork-knife', ru: 'повар официант бармен', en: 'cook chef waiter bartender hospitality' },
  { id: 'manufacturing', label: 'Производство', icon: 'factory', ru: 'оператор токарь слесарь завод', en: 'factory operator manufacturing production' },
  { id: 'finance', label: 'Финансы', icon: 'cash', ru: 'бухгалтер экономист кассир', en: 'accountant finance cashier bank' },
  { id: 'admin', label: 'Офис', icon: 'briefcase-outline', ru: 'секретарь администратор офис-менеджер', en: 'assistant administrator office receptionist' },
  { id: 'it', label: 'IT', icon: 'laptop', ru: 'программист разработчик', en: 'developer software engineer' },
  { id: 'marketing', label: 'Маркетинг', icon: 'bullhorn-outline', ru: 'маркетолог smm дизайнер', en: 'marketing designer smm content' },
  { id: 'legal', label: 'Юриспруденция', icon: 'scale-balance', ru: 'юрист адвокат', en: 'lawyer legal counsel attorney' },
  { id: 'agriculture', label: 'Агро', icon: 'barley', ru: 'агроном тракторист', en: 'farm agriculture agronomist' },
  { id: 'security', label: 'Охрана', icon: 'shield-outline', ru: 'охранник безопасность', en: 'security guard' },
  { id: 'beauty', label: 'Красота', icon: 'content-cut', ru: 'парикмахер косметолог мастер маникюра', en: 'beauty salon hairdresser nail' },
  { id: 'hr', label: 'HR', icon: 'account-group-outline', ru: 'рекрутер кадровик hr', en: 'recruiter hr human resources' },
  { id: 'home', label: 'Дом и уход', icon: 'home-outline', ru: 'няня сиделка домработница уборщица', en: 'nanny caregiver cleaner housekeeper' },
];

export const CIS_AREAS = ['113', '40', '16', '9', '97', '48', '28', '62', '7', '5'];

export const CIS_HINTS = [
  'russia', 'россия', 'belarus', 'беларус', 'kazakhstan', 'казахстан',
  'uzbekistan', 'узбекистан', 'armenia', 'армения', 'azerbaijan', 'азербайджан',
  'kyrgyz', 'киргиз', 'кыргыз', 'moldova', 'молдав', 'tajik', 'таджик',
  'georgia', 'грузия', 'ukraine', 'украин', 'minsk', 'almaty', 'tashkent',
  'yerevan', 'baku', 'bishkek', 'chisinau', 'moscow', 'москва', 'питер',
];

export const EUROPE_HINTS = [
  'germany', 'france', 'spain', 'italy', 'poland', 'netherlands', 'sweden',
  'norway', 'finland', 'denmark', 'austria', 'belgium', 'portugal', 'czech',
  'romania', 'hungary', 'ireland', 'switzerland', 'greece', 'europe', 'eu',
  'berlin', 'paris', 'warsaw', 'amsterdam', 'madrid', 'rome', 'vienna',
  'lithuania', 'latvia', 'estonia', 'slovakia', 'slovenia', 'croatia',
  'bulgaria', 'serbia', 'uk', 'united kingdom', 'london', 'britain',
];

export const WEST_HINTS = [
  'united states', 'usa', 'u.s', 'canada', 'australia', 'new zealand',
  'uk', 'united kingdom', 'britain', 'london', 'new york', 'california',
  'texas', 'toronto', 'vancouver', 'sydney', 'melbourne', 'auckland',
  'ireland', 'dublin',
];

export const ASIA_HINTS = [
  'india', 'singapore', 'japan', 'korea', 'china', 'vietnam', 'thailand',
  'indonesia', 'malaysia', 'philippines', 'pakistan', 'bangladesh', 'taiwan',
  'hong kong', 'uae', 'dubai', 'saudi', 'qatar', 'israel', 'turkey',
  'bangkok', 'jakarta', 'manila', 'tokyo', 'seoul', 'mumbai', 'delhi',
  'bengaluru', 'bangalore', 'ho chi minh', 'asia',
];

export function hintsForRegion(region: RegionId): string[] | null {
  switch (region) {
    case 'cis':
      return CIS_HINTS;
    case 'europe':
      return EUROPE_HINTS;
    case 'west':
      return WEST_HINTS;
    case 'asia':
      return ASIA_HINTS;
    default:
      return null;
  }
}

export function locationMatchesRegion(location: string, region: RegionId): boolean {
  if (region === 'all' || region === 'remote') return true;
  const hints = hintsForRegion(region);
  if (!hints) return true;
  const hay = location.toLowerCase();
      if (!hay.trim()) return false;
  return hints.some((h) => hay.includes(h));
}

export function categoryTerms(category: CategoryId, lang: 'ru' | 'en'): string {
  const item = CATEGORIES.find((c) => c.id === category);
  if (!item) return '';
  return lang === 'ru' ? item.ru : item.en;
}

export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[\s,/+_-]+/)
    .map((token) => token.trim())
    .filter((token) => token.length > 1);
}

function hasToken(hay: string, token: string): boolean {
  const escaped = token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`(^|[^a-zA-Zа-яА-ЯёЁ0-9+#])${escaped}(?=[^a-zA-Zа-яА-ЯёЁ0-9+#]|$)`, 'i').test(hay);
}

export function buildQuery(query: string, category: CategoryId, lang: 'ru' | 'en'): string {
  const q = query.trim();
  if (q) return q;
  return categoryTerms(category, lang);
}

export function jobMatchesRegion(location: string, region: RegionId, isRemote = false): boolean {
  if (region === 'all') return true;
  if (region === 'remote') return isRemote || /remote|worldwide|anywhere|удал/i.test(location);
  return locationMatchesRegion(location, region);
}

export function jobMatchesSearch(
  haystack: string,
  query: string,
  category: CategoryId = 'all',
  lang: 'en' | 'ru' = 'en',
): boolean {
  const hay = haystack.toLowerCase();
  const userTokens = tokenize(query);
  if (userTokens.length) return userTokens.every((token) => hasToken(hay, token));
  const catTokens = tokenize(categoryTerms(category, lang));
  if (!catTokens.length) return true;
  return catTokens.some((token) => hasToken(hay, token));
}

export function toggleCategory(selected: CategoryId[], id: CategoryId): CategoryId[] {
  if (id === 'all') return ['all'];
  const current = selected.filter((item) => item !== 'all');
  if (current.includes(id)) {
    const next = current.filter((item) => item !== id);
    return next.length ? next : ['all'];
  }
  return [...current, id];
}

export function apiCategory(selected: CategoryId[]): CategoryId {
  const unique = selected.filter((id) => id !== 'all');
  if (unique.length === 1) return unique[0];
  return 'all';
}

export function jobMatchesCategories(haystack: string, categories: CategoryId[]): boolean {
  const selected = categories.filter((id) => id !== 'all');
  if (selected.length <= 1) return true;
  return selected.some(
    (category) =>
      jobMatchesSearch(haystack, '', category, 'ru') || jobMatchesSearch(haystack, '', category, 'en'),
  );
}

export type CatalogCountryId =
  | 'az'
  | 'ru'
  | 'ua'
  | 'by'
  | 'kz'
  | 'uz'
  | 'am'
  | 'ge'
  | 'kg'
  | 'md'
  | 'tj'
  | 'eu'
  | 'de'
  | 'pl'
  | 'uk'
  | 'fr'
  | 'es'
  | 'it'
  | 'nl'
  | 'cz'
  | 'at'
  | 'ch'
  | 'se'
  | 'ie'
  | 'pt'
  | 'ro'
  | 'hu'
  | 'be'
  | 'dk'
  | 'fi'
  | 'no'
  | 'lt'
  | 'lv'
  | 'ee'
  | 'bg'
  | 'rs'
  | 'hr'
  | 'sk'
  | 'us'
  | 'ca'
  | 'au'
  | 'nz'
  | 'tr'
  | 'ae'
  | 'in'
  | 'sg'
  | 'jp'
  | 'remote'
  | 'intl';

export type CatalogRegionId = 'cis' | 'europe' | 'west' | 'asia' | 'remote' | 'intl';
export type CatalogFilterId = 'all' | CatalogRegionId | CatalogCountryId;
export type CatalogFocus = 'all' | 'it' | 'junior' | 'gov' | 'remote' | 'classifieds' | 'startup';
export type CatalogAccess = 'free' | 'account' | 'paid';

export type CatalogLink = {
  id: string;
  title: string;
  note?: string;
  url: string;
  handle?: string;
  country: CatalogCountryId;
  focus?: CatalogFocus;
  access?: CatalogAccess;
  langs?: string;
};

export const CATALOG_COUNTRIES: { id: CatalogCountryId; label: string; region: CatalogRegionId }[] = [
  { id: 'az', label: 'Азербайджан', region: 'cis' },
  { id: 'ru', label: 'Россия', region: 'cis' },
  { id: 'ua', label: 'Украина', region: 'cis' },
  { id: 'by', label: 'Беларусь', region: 'cis' },
  { id: 'kz', label: 'Казахстан', region: 'cis' },
  { id: 'uz', label: 'Узбекистан', region: 'cis' },
  { id: 'am', label: 'Армения', region: 'cis' },
  { id: 'ge', label: 'Грузия', region: 'cis' },
  { id: 'kg', label: 'Кыргызстан', region: 'cis' },
  { id: 'md', label: 'Молдова', region: 'cis' },
  { id: 'tj', label: 'Таджикистан', region: 'cis' },
  { id: 'eu', label: 'Вся Европа', region: 'europe' },
  { id: 'de', label: 'Германия', region: 'europe' },
  { id: 'pl', label: 'Польша', region: 'europe' },
  { id: 'uk', label: 'Великобритания', region: 'europe' },
  { id: 'fr', label: 'Франция', region: 'europe' },
  { id: 'es', label: 'Испания', region: 'europe' },
  { id: 'it', label: 'Италия', region: 'europe' },
  { id: 'nl', label: 'Нидерланды', region: 'europe' },
  { id: 'cz', label: 'Чехия', region: 'europe' },
  { id: 'at', label: 'Австрия', region: 'europe' },
  { id: 'ch', label: 'Швейцария', region: 'europe' },
  { id: 'se', label: 'Швеция', region: 'europe' },
  { id: 'ie', label: 'Ирландия', region: 'europe' },
  { id: 'pt', label: 'Португалия', region: 'europe' },
  { id: 'ro', label: 'Румыния', region: 'europe' },
  { id: 'hu', label: 'Венгрия', region: 'europe' },
  { id: 'be', label: 'Бельгия', region: 'europe' },
  { id: 'dk', label: 'Дания', region: 'europe' },
  { id: 'fi', label: 'Финляндия', region: 'europe' },
  { id: 'no', label: 'Норвегия', region: 'europe' },
  { id: 'lt', label: 'Литва', region: 'europe' },
  { id: 'lv', label: 'Латвия', region: 'europe' },
  { id: 'ee', label: 'Эстония', region: 'europe' },
  { id: 'bg', label: 'Болгария', region: 'europe' },
  { id: 'rs', label: 'Сербия', region: 'europe' },
  { id: 'hr', label: 'Хорватия', region: 'europe' },
  { id: 'sk', label: 'Словакия', region: 'europe' },
  { id: 'us', label: 'США', region: 'west' },
  { id: 'ca', label: 'Канада', region: 'west' },
  { id: 'au', label: 'Австралия', region: 'west' },
  { id: 'nz', label: 'Новая Зеландия', region: 'west' },
  { id: 'tr', label: 'Турция', region: 'asia' },
  { id: 'ae', label: 'ОАЭ', region: 'asia' },
  { id: 'in', label: 'Индия', region: 'asia' },
  { id: 'sg', label: 'Сингапур', region: 'asia' },
  { id: 'jp', label: 'Япония', region: 'asia' },
  { id: 'remote', label: 'Удалёнка', region: 'remote' },
  { id: 'intl', label: 'Мир', region: 'intl' },
];

export type CatalogFilters = {
  region: 'all' | CatalogRegionId;
  country: 'all' | CatalogCountryId;
};

export const DEFAULT_CATALOG_FILTERS: CatalogFilters = { region: 'all', country: 'all' };

export const CATALOG_REGION_FILTERS: { id: CatalogFilters['region']; label: string }[] = [
  { id: 'all', label: 'Все' },
  { id: 'cis', label: 'СНГ' },
  { id: 'europe', label: 'Европа' },
  { id: 'west', label: 'Запад' },
  { id: 'asia', label: 'Азия' },
  { id: 'remote', label: 'Удалёнка' },
  { id: 'intl', label: 'Мир' },
];

const COUNTRY_BY_ID = new Map(CATALOG_COUNTRIES.map((item) => [item.id, item]));
const REGION_IDS = new Set<CatalogFilterId>(['cis', 'europe', 'west', 'asia', 'remote', 'intl']);

export function countryMeta(id: CatalogCountryId) {
  return COUNTRY_BY_ID.get(id) ?? { id, label: id, region: 'intl' as const };
}

export function catalogFiltersActive(filters: CatalogFilters): boolean {
  return filters.region !== 'all' || filters.country !== 'all';
}

export function countriesForRegion(region: CatalogFilters['region']) {
  if (region === 'all') return CATALOG_COUNTRIES;
  return CATALOG_COUNTRIES.filter((item) => item.region === region);
}

export function catalogMatchesFilter(item: CatalogLink, filter: CatalogFilterId): boolean {
  if (filter === 'all') return true;
  if (filter === item.country) return true;
  if (REGION_IDS.has(filter)) return countryMeta(item.country).region === filter;
  return false;
}

export function catalogMatchesSelection(item: CatalogLink, filters: CatalogFilters): boolean {
  if (filters.country !== 'all') return item.country === filters.country;
  if (filters.region !== 'all') return countryMeta(item.country).region === filters.region;
  return true;
}

export function filterCatalog(items: CatalogLink[], filter: CatalogFilterId): CatalogLink[] {
  if (filter === 'all') return items;
  return items.filter((item) => catalogMatchesFilter(item, filter));
}

export function filterCatalogBySelection(items: CatalogLink[], filters: CatalogFilters): CatalogLink[] {
  if (!catalogFiltersActive(filters)) return items;
  return items.filter((item) => catalogMatchesSelection(item, filters));
}

export function catalogFilterChips(items: CatalogLink[]): { id: CatalogFilterId; label: string }[] {
  const present = new Set(items.map((item) => item.country));
  const regions = new Set<CatalogFilters['region']>(
    [...present]
      .map((id) => countryMeta(id).region)
      .filter((region) => region === 'cis' || region === 'europe' || region === 'west' || region === 'asia'),
  );
  const chips: { id: CatalogFilterId; label: string }[] = [{ id: 'all', label: 'Все' }];
  for (const group of CATALOG_REGION_FILTERS) {
    if (group.id !== 'all' && regions.has(group.id)) chips.push(group);
  }
  for (const country of CATALOG_COUNTRIES) {
    if (present.has(country.id)) chips.push({ id: country.id, label: country.label });
  }
  return chips;
}

export function groupCatalogByCountry(items: CatalogLink[]): { id: CatalogCountryId; label: string; items: CatalogLink[] }[] {
  const buckets = new Map<CatalogCountryId, CatalogLink[]>();
  for (const item of items) {
    const list = buckets.get(item.country);
    if (list) list.push(item);
    else buckets.set(item.country, [item]);
  }
  return CATALOG_COUNTRIES.flatMap((country) => {
    const group = buckets.get(country.id);
    return group?.length ? [{ id: country.id, label: country.label, items: group }] : [];
  });
}

const COUNTRY_LANG: Record<CatalogCountryId, string> = {
  az: 'AZ / RU',
  ru: 'RU',
  ua: 'UK / RU',
  by: 'RU / BE',
  kz: 'KK / RU',
  uz: 'UZ / RU',
  am: 'HY / EN',
  ge: 'KA / EN',
  kg: 'KY / RU',
  md: 'RO / RU',
  tj: 'TG / RU',
  eu: 'EN',
  de: 'DE / EN',
  pl: 'PL / EN',
  uk: 'EN',
  fr: 'FR',
  es: 'ES',
  it: 'IT',
  nl: 'NL / EN',
  cz: 'CS / EN',
  at: 'DE',
  ch: 'DE / FR',
  se: 'SV',
  ie: 'EN',
  pt: 'PT',
  ro: 'RO',
  hu: 'HU',
  be: 'NL / FR',
  dk: 'DA',
  fi: 'FI',
  no: 'NO',
  lt: 'LT',
  lv: 'LV',
  ee: 'ET',
  bg: 'BG',
  rs: 'SR',
  hr: 'HR',
  sk: 'SK',
  us: 'EN',
  ca: 'EN / FR',
  au: 'EN',
  nz: 'EN',
  tr: 'TR',
  ae: 'EN / AR',
  in: 'EN / HI',
  sg: 'EN',
  jp: 'JA / EN',
  remote: 'EN',
  intl: 'EN',
};

export function inferCatalogMeta(item: CatalogLink): {
  focus: CatalogFocus;
  access: CatalogAccess;
  langs: string;
} {
  const hay = `${item.id} ${item.title} ${item.note ?? ''} ${item.handle ?? ''} ${item.url}`.toLowerCase();
  let focus: CatalogFocus = 'all';
  if (/olx|lalafo|list\.am|999\.md|somon|avito|subito|trademe/.test(hay)) focus = 'classifieds';
  else if (/junior|стаж|intern|young|авоськ/.test(hay)) focus = 'junior';
  else if (/flexjobs|we work remotely|remoteok|remotive|himalayas|jobicy|workingnomads|arbeitnow|удалён/.test(hay)) {
    focus = 'remote';
  } else if (
    /trudvsem|enbek|usajobs|gov\.uk|arbeitsagentur|francetravail|jobbank|mycareersfuture|arbetsformedlingen|werk\.nl|vdab/.test(
      hay,
    )
  ) {
    focus = 'gov';
  }   else if (/startupjobs|wellfound/.test(hay)) focus = 'startup';
  else if (
    /habr|geek|djinni|dou|devby|justjoin|nofluff|dice|getmatch|tproger|devit|green-japan|cwjobs|jobitt|it.?jobs|it.?digital|it-ваканси|it & digital/.test(
      hay,
    )
  ) {
    focus = 'it';
  }

  let access: CatalogAccess = 'free';
  if (/flexjobs/.test(hay)) access = 'paid';
  else if (/linkedin|xing|glassdoor/.test(hay)) access = 'account';

  return {
    focus: item.focus ?? focus,
    access: item.access ?? access,
    langs: item.langs ?? COUNTRY_LANG[item.country] ?? 'EN',
  };
}

export function catalogFacts(item: CatalogLink, telegram: boolean): { id: 'type' | 'region' | 'focus' | 'langs' | 'access'; value: string }[] {
  const meta = inferCatalogMeta(item);
  const country = countryMeta(item.country);
  return [
    { id: 'type', value: telegram ? 'telegram' : 'site' },
    { id: 'region', value: country.region },
    { id: 'focus', value: meta.focus },
    { id: 'langs', value: meta.langs },
    { id: 'access', value: meta.access },
  ];
}

function tg(country: CatalogCountryId, handle: string, title: string, note: string): CatalogLink {
  return { id: handle, title, handle, url: `https://t.me/${handle}`, note, country };
}

function site(country: CatalogCountryId, id: string, title: string, url: string, note?: string): CatalogLink {
  return { id, title, url, note, country };
}

export const TELEGRAM_GROUPS: CatalogLink[] = [
  tg('az', 'jobsearchazerbaijan', 'JobSearch.az', 'Официальный канал jobsearch.az'),
  tg('az', 'hellojobaz', 'HelloJob.az', 'Вакансии HelloJob по Азербайджану'),
  tg('az', 'azvakaz', 'AzVak', 'Вакансии AzVak'),
  tg('az', 'azvak1', 'AzVak.az', 'Канал площадки AzVak.az'),
  tg('az', 'smartjobaz', 'SmartJob.az', 'Вакансии SmartJob'),
  tg('az', 'smartjobaztecrube', 'SmartJob стажировки', 'Стажировки и junior-вакансии'),
  tg('az', 'busy_az_vakansiyalar', 'Busy.az', 'Вакансии Busy.az'),
  tg('az', 'baku_rabotae', 'Вакансии в Баку', 'Подборка вакансий по Баку'),

  tg('ru', 'hh_ru_official', 'hh.ru', 'Официальный канал HeadHunter'),
  tg('ru', 'superjob_ru', 'SuperJob', 'Официальный канал SuperJob'),
  tg('ru', 'habr_career', 'Хабр Карьера', 'Вакансии и карьерные материалы Habr Career'),
  tg('ru', 'geekjobs', 'Geekjob', 'IT и digital вакансии'),
  tg('ru', 'it_vakansii_jobs', 'СЕТИ — IT & Digital', 'Ежедневные IT-вакансии с контактами HR'),
  tg('ru', 'young_june', 'Young & Junior', 'Junior и стажировки в IT по РФ и СНГ'),
  tg('ru', 'juniors_rabota_jobs', 'Джуниор вакансии IT', 'Стажировки и junior-роли'),
  tg('ru', 'jobs_juniors_remote', 'Авоська', 'Удалёнка для джунов и стажёров'),
  tg('ru', 'theyseeku', 'Finder.work', 'Крупный агрегатор вакансий'),

  tg('ua', 'ukrjob_one', 'UKRJOB', 'Вакансии по Украине, в том числе онлайн'),
  tg('ua', 'JOBITT_Ukraine', 'JOBITT Ukraine', 'IT-вакансии с jobitt.com'),
  tg('ua', 'jobzilla_ua', 'Jobzilla UA', 'Удалённые вакансии и карьерные подборки'),
  tg('ua', 'djinni_productjobs', 'Djinni Product Jobs', 'Вакансии продуктовых компаний с Djinni'),

  tg('de', 'jobde', 'Работа в Германии', 'Вакансии и советы по жизни в Германии'),
  tg('de', 'germanitjobs', 'German IT Jobs', 'IT-вакансии в Германии'),
  tg('de', 'jobs_ingermany', 'Jobs in Germany-Europe', 'Вакансии в Германии и Европе'),
  tg('de', 'germanworks', 'Work-in-Germany', 'Работа в Германии'),
  tg('de', 'jobdeua', 'Германия: интеграция и работа', 'Новости, вакансии и адаптация в Германии'),

  tg('uk', 'devitjobs', 'DevITJobs.uk', 'IT-вакансии в Великобритании'),
  tg('eu', 'jobs_in_europ', 'Jobs in Europe', 'Вакансии по Европе с прямыми ссылками работодателей'),
  tg('remote', 'remoteok', 'Remote OK', 'Лента удалённых вакансий Remote OK'),
];

export const JOB_SITES: CatalogLink[] = [
  site('az', 'hhaz', 'HeadHunter AZ', 'https://hh.az'),
  site('az', 'birjob', 'BirJob', 'https://www.birjob.com'),
  site('az', 'boss', 'Boss.az', 'https://boss.az'),
  site('az', 'hellojob', 'HelloJob.az', 'https://www.hellojob.az'),
  site('az', 'jobsearch', 'JobSearch.az', 'https://www.jobsearch.az'),
  site('az', 'offer', 'Offer.az', 'https://www.offer.az'),
  site('az', 'rabota-az', 'Rabota.az', 'https://www.rabota.az'),
  site('az', 'busy', 'Busy.az', 'https://busy.az'),
  site('az', 'smartjob', 'SmartJob.az', 'https://smartjob.az'),
  site('az', 'azvak', 'AzVak.az', 'https://azvak.az'),
  site('az', 'glorri', 'Glorri', 'https://glorri.com'),
  site('az', 'olx-az', 'OLX — İş elanları', 'https://www.olx.az/is-elanlari/'),

  site('ru', 'hhru', 'HeadHunter', 'https://hh.ru'),
  site('ru', 'superjob', 'SuperJob', 'https://www.superjob.ru'),
  site('ru', 'avito', 'Авито Работа', 'https://www.avito.ru/all/vakansii'),
  site('ru', 'trudvsem', 'Работа России', 'https://trudvsem.ru'),
  site('ru', 'rabotaru', 'Работа.ру', 'https://www.rabota.ru'),
  site('ru', 'habr-career', 'Хабр Карьера', 'https://career.habr.com'),
  site('ru', 'geekjob', 'Geekjob', 'https://geekjob.ru'),
  site('ru', 'zarplata', 'Zarplata.ru', 'https://www.zarplata.ru'),
  site('ru', 'worki', 'Worki', 'https://worki.ru'),
  site('ru', 'yandex-jobs', 'Яндекс Jobs', 'https://yandex.ru/jobs'),
  site('ru', 'getmatch', 'GetMatch', 'https://getmatch.ru'),
  site('ru', 'tproger-jobs', 'Tproger Jobs', 'https://tproger.ru/jobs'),
  site('ru', 'joblab', 'JobLab', 'https://joblab.ru'),

  site('ua', 'workua', 'Work.ua', 'https://www.work.ua'),
  site('ua', 'rabotaua', 'Robota.ua', 'https://robota.ua'),
  site('ua', 'djinni', 'Djinni', 'https://djinni.co'),
  site('ua', 'dou', 'DOU Jobs', 'https://jobs.dou.ua'),
  site('ua', 'olx-ua', 'OLX Робота', 'https://www.olx.ua/uk/rabota/'),
  site('ua', 'jobitt', 'JOBITT', 'https://jobitt.com'),

  site('by', 'rabotaby', 'Работа.by', 'https://rabota.by'),
  site('by', 'belmeta', 'Belmeta', 'https://belmeta.com'),
  site('by', 'praca-by', 'Praca.by', 'https://praca.by'),
  site('by', 'devby', 'devby Jobs', 'https://jobs.devby.io'),
  site('by', 'olx-by', 'OLX Работа', 'https://www.olx.by/rabota/'),

  site('kz', 'hhkz', 'HeadHunter KZ', 'https://hh.kz'),
  site('kz', 'enbek', 'Enbek.kz', 'https://www.enbek.kz'),
  site('kz', 'olx-kz', 'OLX Жұмыс', 'https://www.olx.kz/rabota/'),
  site('kz', 'qsamruk', 'Samruk-Kazyna Career', 'https://qsamruk.kz'),

  site('uz', 'hhuz', 'HeadHunter UZ', 'https://hh.uz'),
  site('uz', 'olx-uz', 'OLX Ish', 'https://www.olx.uz/rabota/'),
  site('uz', 'ishuz', 'Ish.uz', 'https://ish.uz'),
  site('uz', 'lalafo-uz', 'Lalafo Работа', 'https://lalafo.uz/rabota'),

  site('am', 'staffam', 'Staff.am', 'https://staff.am'),
  site('am', 'hham', 'HeadHunter AM', 'https://hh.am'),
  site('am', 'listam', 'List.am Jobs', 'https://www.list.am/category/211'),
  site('am', 'careercenter', 'Career Center', 'https://www.careercenter.am'),

  site('ge', 'jobsge', 'Jobs.ge', 'https://www.jobs.ge'),
  site('ge', 'hrge', 'HR.ge', 'https://www.hr.ge'),
  site('ge', 'myjobsge', 'MyJobs.ge', 'https://www.myjobs.ge'),
  site('ge', 'hhge', 'HeadHunter GE', 'https://hh.ge'),

  site('kg', 'hhkg', 'HeadHunter KG', 'https://hh.kg'),
  site('kg', 'jobkg', 'Job.kg', 'https://www.job.kg'),
  site('kg', 'lalafo-kg', 'Lalafo Работа', 'https://lalafo.kg/rabota'),

  site('md', 'rabotamd', 'Rabota.md', 'https://www.rabota.md'),
  site('md', 'delucru', 'Delucru.md', 'https://www.delucru.md'),
  site('md', '999md', '999.md Lucru', 'https://999.md/ru/list/work'),

  site('tj', 'somon', 'Somon.tj', 'https://somon.tj/rabota/'),

  site('de', 'stepstone', 'StepStone', 'https://www.stepstone.de'),
  site('de', 'indeed-de', 'Indeed Германия', 'https://de.indeed.com'),
  site('de', 'arbeitsagentur', 'Bundesagentur für Arbeit', 'https://www.arbeitsagentur.de'),
  site('de', 'xing', 'XING Jobs', 'https://www.xing.com/jobs'),
  site('de', 'monster-de', 'Monster Германия', 'https://www.monster.de'),
  site('de', 'kimeta', 'Kimeta', 'https://www.kimeta.de'),

  site('pl', 'pracuj', 'Pracuj.pl', 'https://www.pracuj.pl'),
  site('pl', 'olx-pl', 'OLX Praca', 'https://www.olx.pl/praca/'),
  site('pl', 'justjoin', 'JustJoin.it', 'https://justjoin.it'),
  site('pl', 'nofluff', 'No Fluff Jobs', 'https://nofluffjobs.com'),
  site('pl', 'rocketjobs', 'RocketJobs', 'https://rocketjobs.pl'),
  site('pl', 'infopraca', 'InfoPraca', 'https://www.infopraca.pl'),

  site('uk', 'indeed-uk', 'Indeed UK', 'https://uk.indeed.com'),
  site('uk', 'reed', 'Reed', 'https://www.reed.co.uk'),
  site('uk', 'totaljobs', 'Totaljobs', 'https://www.totaljobs.com'),
  site('uk', 'cwjobs', 'CWJobs', 'https://www.cwjobs.co.uk'),
  site('uk', 'govuk-jobs', 'Find a job', 'https://www.gov.uk/find-a-job'),
  site('uk', 'devitjobs-web', 'DevITJobs', 'https://devitjobs.uk'),

  site('fr', 'francetravail', 'France Travail', 'https://www.francetravail.fr'),
  site('fr', 'indeed-fr', 'Indeed Франция', 'https://fr.indeed.com'),
  site('fr', 'apec', 'APEC', 'https://www.apec.fr'),
  site('fr', 'wttj', 'Welcome to the Jungle', 'https://www.welcometothejungle.com'),

  site('es', 'infojobs', 'InfoJobs', 'https://www.infojobs.net'),
  site('es', 'indeed-es', 'Indeed Испания', 'https://es.indeed.com'),
  site('es', 'infoempleo', 'Infoempleo', 'https://www.infoempleo.com'),

  site('it', 'indeed-it', 'Indeed Италия', 'https://it.indeed.com'),
  site('it', 'infojobs-it', 'InfoJobs Италия', 'https://www.infojobs.it'),
  site('it', 'subito', 'Subito Lavoro', 'https://www.subito.it/annunci-italia/lavoro/'),

  site('nl', 'indeed-nl', 'Indeed Нидерланды', 'https://nl.indeed.com'),
  site('nl', 'werkenl', 'Werk.nl', 'https://www.werk.nl'),
  site('nl', 'nvb', 'Nationale Vacaturebank', 'https://www.nationalevacaturebank.nl'),

  site('cz', 'jobscz', 'Jobs.cz', 'https://www.jobs.cz'),
  site('cz', 'prace', 'Prace.cz', 'https://www.prace.cz'),
  site('cz', 'startupjobs', 'StartupJobs', 'https://startupjobs.cz'),

  site('at', 'karriereat', 'Karriere.at', 'https://www.karriere.at'),
  site('ch', 'jobsch', 'Jobs.ch', 'https://www.jobs.ch'),
  site('se', 'arbetsformedlingen', 'Arbetsförmedlingen', 'https://arbetsformedlingen.se'),
  site('ie', 'irishjobs', 'IrishJobs', 'https://www.irishjobs.ie'),
  site('ie', 'jobsie', 'Jobs.ie', 'https://www.jobs.ie'),
  site('pt', 'netempregos', 'Net-Empregos', 'https://www.net-empregos.com'),
  site('ro', 'ejobs', 'eJobs', 'https://www.ejobs.ro'),
  site('ro', 'bestjobs', 'BestJobs', 'https://www.bestjobs.eu'),
  site('hu', 'profession', 'Profession.hu', 'https://www.profession.hu'),
  site('be', 'vdab', 'VDAB', 'https://www.vdab.be'),
  site('dk', 'jobindex', 'Jobindex', 'https://www.jobindex.dk'),
  site('fi', 'duunitori', 'Duunitori', 'https://duunitori.fi'),
  site('no', 'finn', 'Finn.no Jobb', 'https://www.finn.no/job'),
  site('lt', 'cvbankas', 'CVbankas', 'https://www.cvbankas.lt'),
  site('lv', 'cvlv', 'CV.lv', 'https://www.cv.lv'),
  site('ee', 'cvkeskus', 'CVKeskus', 'https://www.cvkeskus.ee'),
  site('bg', 'jobsbg', 'Jobs.bg', 'https://www.jobs.bg'),
  site('rs', 'infostud', 'Infostud Poslovi', 'https://poslovi.infostud.com'),
  site('hr', 'mojposao', 'MojPosao', 'https://www.moj-posao.net'),
  site('sk', 'profesia', 'Profesia.sk', 'https://www.profesia.sk'),

  site('us', 'indeed-us', 'Indeed', 'https://www.indeed.com'),
  site('us', 'linkedin-us', 'LinkedIn Jobs', 'https://www.linkedin.com/jobs'),
  site('us', 'glassdoor', 'Glassdoor', 'https://www.glassdoor.com/Job/index.htm'),
  site('us', 'ziprecruiter', 'ZipRecruiter', 'https://www.ziprecruiter.com'),
  site('us', 'usajobs', 'USAJOBS', 'https://www.usajobs.gov'),
  site('us', 'dice', 'Dice', 'https://www.dice.com'),
  site('us', 'wellfound', 'Wellfound', 'https://wellfound.com'),
  site('us', 'monster-us', 'Monster', 'https://www.monster.com'),

  site('ca', 'indeed-ca', 'Indeed Канада', 'https://ca.indeed.com'),
  site('ca', 'jobbank', 'Job Bank', 'https://www.jobbank.gc.ca'),
  site('ca', 'workopolis', 'Workopolis', 'https://www.workopolis.com'),

  site('au', 'seek-au', 'SEEK', 'https://www.seek.com.au'),
  site('au', 'indeed-au', 'Indeed Австралия', 'https://au.indeed.com'),
  site('nz', 'seek-nz', 'SEEK NZ', 'https://www.seek.co.nz'),
  site('nz', 'trademe', 'Trade Me Jobs', 'https://www.trademe.co.nz/a/jobs'),

  site('tr', 'kariyer', 'Kariyer.net', 'https://www.kariyer.net'),
  site('tr', 'yenibiris', 'Yenibiris', 'https://www.yenibiris.com'),
  site('ae', 'bayt', 'Bayt', 'https://www.bayt.com'),
  site('ae', 'gulftalent', 'GulfTalent', 'https://www.gulftalent.com'),
  site('ae', 'naukrigulf', 'NaukriGulf', 'https://www.naukrigulf.com'),
  site('in', 'naukri', 'Naukri', 'https://www.naukri.com'),
  site('in', 'internshala', 'Internshala', 'https://internshala.com'),
  site('sg', 'jobstreet-sg', 'JobStreet', 'https://www.jobstreet.com.sg'),
  site('sg', 'mycareersfuture', 'MyCareersFuture', 'https://www.mycareersfuture.gov.sg'),
  site('jp', 'indeed-jp', 'Indeed Япония', 'https://jp.indeed.com'),
  site('jp', 'green', 'Green', 'https://www.green-japan.com'),

  site('remote', 'remoteok-web', 'Remote OK', 'https://remoteok.com'),
  site('remote', 'wwr', 'We Work Remotely', 'https://weworkremotely.com'),
  site('remote', 'remotive-web', 'Remotive', 'https://remotive.com'),
  site('remote', 'himalayas', 'Himalayas', 'https://himalayas.app'),
  site('remote', 'jobicy', 'Jobicy', 'https://jobicy.com'),
  site('remote', 'workingnomads', 'Working Nomads', 'https://www.workingnomads.com'),
  site('remote', 'flexjobs', 'FlexJobs', 'https://www.flexjobs.com'),
  site('remote', 'arbeitnow', 'Arbeitnow', 'https://www.arbeitnow.com'),

  site('intl', 'linkedin', 'LinkedIn', 'https://www.linkedin.com/jobs'),
  site('intl', 'indeed', 'Indeed', 'https://www.indeed.com'),
  site('intl', 'jooble', 'Jooble', 'https://jooble.org'),
  site('intl', 'adzuna', 'Adzuna', 'https://www.adzuna.com'),
  site('intl', 'glassdoor-intl', 'Glassdoor', 'https://www.glassdoor.com'),
];

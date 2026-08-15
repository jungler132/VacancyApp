export type CatalogLink = {
  id: string;
  title: string;
  note?: string;
  url: string;
  handle?: string;
};

export const TELEGRAM_GROUPS: CatalogLink[] = [
  {
    id: 'jobsearchazerbaijan',
    title: 'JobSearch.az',
    handle: 'jobsearchazerbaijan',
    url: 'https://t.me/jobsearchazerbaijan',
    note: 'Официальный канал jobsearch.az',
  },
  {
    id: 'hellojobaz',
    title: 'HelloJob.az',
    handle: 'hellojobaz',
    url: 'https://t.me/hellojobaz',
    note: 'Вакансии HelloJob по Азербайджану',
  },
  {
    id: 'azvakaz',
    title: 'AzVak',
    handle: 'azvakaz',
    url: 'https://t.me/azvakaz',
    note: 'Вакансии AzVak',
  },
  {
    id: 'azvak1',
    title: 'AzVak.az',
    handle: 'azvak1',
    url: 'https://t.me/azvak1',
    note: 'Канал площадки AzVak.az',
  },
  {
    id: 'smartjobaz',
    title: 'SmartJob.az',
    handle: 'smartjobaz',
    url: 'https://t.me/smartjobaz',
    note: 'Вакансии SmartJob',
  },
  {
    id: 'smartjobaztecrube',
    title: 'SmartJob стажировки',
    handle: 'smartjobaztecrube',
    url: 'https://t.me/smartjobaztecrube',
    note: 'Стажировки и junior-вакансии',
  },
  {
    id: 'busy_az_vakansiyalar',
    title: 'Busy.az',
    handle: 'busy_az_vakansiyalar',
    url: 'https://t.me/busy_az_vakansiyalar',
    note: 'Вакансии Busy.az',
  },
  {
    id: 'baku_rabotae',
    title: 'Вакансии в Баку',
    handle: 'baku_rabotae',
    url: 'https://t.me/baku_rabotae',
    note: 'Подборка вакансий по Баку',
  },
];

export const AZ_JOB_SITES: CatalogLink[] = [
  { id: 'hhaz', title: 'HeadHunter AZ', url: 'https://hh.az' },
  { id: 'birjob', title: 'BirJob', url: 'https://www.birjob.com' },
  { id: 'boss', title: 'Boss.az', url: 'https://boss.az' },
  { id: 'hellojob', title: 'HelloJob.az', url: 'https://www.hellojob.az' },
  { id: 'jobsearch', title: 'JobSearch.az', url: 'https://www.jobsearch.az' },
  { id: 'offer', title: 'Offer.az', url: 'https://www.offer.az' },
  { id: 'rabota', title: 'Rabota.az', url: 'https://www.rabota.az' },
  { id: 'busy', title: 'Busy.az', url: 'https://busy.az' },
  { id: 'smartjob', title: 'SmartJob.az', url: 'https://smartjob.az' },
  { id: 'azvak', title: 'AzVak.az', url: 'https://azvak.az' },
  { id: 'glorri', title: 'Glorri', url: 'https://glorri.com' },
  { id: 'olx', title: 'OLX — İş elanları', url: 'https://www.olx.az/is-elanlari/' },
];

export type RegionId = 'all' | 'cis' | 'az' | 'europe' | 'west' | 'asia' | 'remote';

export type CategoryId =
  | 'all'
  | 'sales'
  | 'medicine'
  | 'logistics'
  | 'construction'
  | 'education'
  | 'hospitality'
  | 'manufacturing'
  | 'finance'
  | 'admin'
  | 'it'
  | 'marketing'
  | 'legal'
  | 'agriculture'
  | 'security'
  | 'beauty'
  | 'hr'
  | 'home';

export type JobTier = 1 | 2 | 3;

export type Job = {
  id: string;
  sourceId: string;
  sourceName: string;
  title: string;
  company: string;
  companyLogo?: string;
  location: string;
  cityId?: string;
  remote: boolean;
  salary?: string;
  employment?: string;
  experience?: string;
  schedule?: string;
  category?: string;
  publishedAt?: string;
  url: string;
  excerpt: string;
  description?: string;
  tier?: JobTier;
  contact?: string;
  archived?: boolean;
};

export type SearchParams = {
  query: string;
  region: RegionId;
  category: CategoryId;
  page: number;
  placeId?: string;
  enabledSources?: string[];
  exhaustedSources?: string[];
  signal?: AbortSignal;
  bypassCache?: boolean;
};

export type SourceError = {
  sourceId: string;
  sourceName: string;
  message: string;
};

export type SearchResult = {
  jobs: Job[];
  errors: SourceError[];
  hasMore: boolean;
  exhaustedSources: string[];
};

export type SourceStatus = 'live' | 'key' | 'soon';

export type SourceInfo = {
  id: string;
  name: string;
  regionLabel: string;
  status: SourceStatus;
  note: string;
};

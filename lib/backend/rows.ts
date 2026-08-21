import { OWN_PROFILE_ID } from '@/lib/store/freelanceSlice';
import { asPlaceId } from '@/lib/places';
import { DEFAULT_HOURS } from '@/lib/services/hours';
import { isServiceKindId } from '@/lib/services/kinds';
import type { ServiceMaster, ServiceOffer, ServiceProfile } from '@/lib/services/types';
import { APP_SOURCE_ID } from '@/lib/tiers';
import type { Job } from '@/lib/types';
import { CATALOG_PAGE, JOBS_TABLE } from './config';
import { isRemoteUri } from './merge';
import { getPublicSupabase, getSupabase } from './supabase';

type ProfileRow = {
  id: string;
  display_name: string;
  bio: string;
  avatar_url: string | null;
  email: string;
  phone: string;
  kinds: string[] | null;
  custom_kinds: string[] | null;
  address: string | null;
  city_id?: string | null;
  hours_open: string;
  hours_close: string;
  hours_days: number[] | null;
  seeking: boolean;
  available: boolean;
  seek_title: string;
  seek_format: string;
  updated_at: string;
  account_state?: unknown;
  company_name?: string;
  company_logo?: string | null;
  company_about?: string;
};

type OfferRow = {
  id: string;
  user_id: string;
  title: string;
  description: string;
  price: string | null;
  currency: string;
  images: string[] | null;
  address: string | null;
  city_id?: string | null;
  phone: string | null;
  kind: string;
  custom_kind: string | null;
  featured: boolean;
  archived?: boolean;
  updated_at: string;
};

type JobRow = {
  id: string;
  user_id: string;
  title: string;
  company: string;
  company_logo: string | null;
  location: string;
  city_id?: string | null;
  remote: boolean;
  salary: string | null;
  employment: string | null;
  experience: string | null;
  schedule: string | null;
  category: string | null;
  published_at: string | null;
  url: string;
  excerpt: string;
  description: string | null;
  tier: number;
  contact: string | null;
  archived?: boolean;
  updated_at: string;
};

export function profileFromRow(row: ProfileRow, own = false): ServiceProfile {
  return {
    id: own ? OWN_PROFILE_ID : `user:${row.id}`,
    displayName: row.display_name,
    bio: row.bio,
    avatarUri: row.avatar_url && (own || isRemoteUri(row.avatar_url)) ? row.avatar_url : undefined,
    photos: [],
    email: row.email,
    phone: row.phone,
    kinds: (row.kinds ?? []) as ServiceProfile['kinds'],
    customKinds: row.custom_kinds ?? [],
    address: row.address || undefined,
    cityId: asPlaceId(row.city_id),
    hours: {
      open: row.hours_open,
      close: row.hours_close,
      days: (row.hours_days ?? [1, 2, 3, 4, 5]) as ServiceProfile['hours']['days'],
    },
    updatedAt: row.updated_at,
  };
}

export function offerFromRow(row: OfferRow, own = false): ServiceOffer {
  return {
    id: row.id,
    profileId: own ? OWN_PROFILE_ID : `user:${row.user_id}`,
    title: row.title,
    description: row.description,
    price: row.price || undefined,
    currency: row.currency,
    images: row.images ?? [],
    address: row.address || undefined,
    cityId: asPlaceId(row.city_id),
    phone: row.phone || undefined,
    kind: isServiceKindId(row.kind) ? row.kind : 'other',
    customKind: row.custom_kind || undefined,
    featured: row.featured,
    archived: Boolean(row.archived),
    updatedAt: row.updated_at,
  };
}

/** Public catalog must never request account_state (kanban, filters, alerts). */
export const PUBLIC_PROFILE_COLUMNS = [
  'id',
  'display_name',
  'bio',
  'avatar_url',
  'email',
  'phone',
  'kinds',
  'custom_kinds',
  'address',
  'city_id',
  'hours_open',
  'hours_close',
  'hours_days',
  'seeking',
  'available',
  'seek_title',
  'seek_format',
  'updated_at',
  'company_name',
  'company_logo',
  'company_about',
].join(',');

const AVATAR_PROFILE_COLUMNS =
  'id,display_name,bio,avatar_url,email,phone,kinds,custom_kinds,address,hours_open,hours_close,hours_days,updated_at';

export function withoutMissingProfileColumn(columns: string, message: string): string | null {
  const match = message.match(/column (?:[\w]+\.)?(\w+) does not exist/i);
  const missing = match?.[1];
  if (!missing || missing === 'id' || missing === 'avatar_url') return null;
  const next = columns.split(',').filter((col) => col !== missing);
  if (next.length === columns.split(',').length) return null;
  return next.join(',');
}

async function selectProfileRows(
  run: (cols: string) => Promise<{ data: unknown; error: { message: string } | null }>,
): Promise<ProfileRow[]> {
  let cols = PUBLIC_PROFILE_COLUMNS;
  for (let i = 0; i < 10; i++) {
    const { data, error } = await run(cols);
    if (!error) {
      if (Array.isArray(data)) return data as ProfileRow[];
      return data ? [data as ProfileRow] : [];
    }
    const next = withoutMissingProfileColumn(cols, error.message);
    if (!next) break;
    cols = next;
  }
  for (const fallback of [AVATAR_PROFILE_COLUMNS, 'id,display_name,avatar_url']) {
    const { data, error } = await run(fallback);
    if (error || data == null) continue;
    if (Array.isArray(data)) return data as ProfileRow[];
    return [data as ProfileRow];
  }
  return [];
}

function isMissingTable(message: string | undefined, table: string) {
  if (!message) return false;
  return new RegExp(`${table}|schema cache|Could not find the table`, 'i').test(message);
}

export function jobFromRow(row: JobRow, own = false): Job {
  const raw = row.id.replace(/^(?:vakano|workly):/, '');
  return {
    id: own ? row.id : `vakano:${row.user_id}:${raw}`,
    sourceId: APP_SOURCE_ID,
    sourceName: 'Vakano',
    title: row.title,
    company: row.company,
    companyLogo: row.company_logo || undefined,
    location: row.location,
    cityId: asPlaceId(row.city_id),
    remote: row.remote,
    salary: row.salary || undefined,
    employment: row.employment || undefined,
    experience: row.experience || undefined,
    schedule: row.schedule || undefined,
    category: row.category || undefined,
    publishedAt: row.published_at || row.updated_at,
    url: row.url,
    excerpt: row.excerpt,
    description: row.description || undefined,
    tier: row.tier === 1 ? 1 : 2,
    contact: row.contact || undefined,
    archived: Boolean(row.archived),
  };
}

export async function fetchOwnRows(userId: string) {
  const supabase = getSupabase();
  if (!supabase) return { profile: null, offers: [] as OfferRow[], jobs: [] as JobRow[] };
  const [profileRows, offers, jobs, privateState] = await Promise.all([
    selectProfileRows((cols) => supabase.from('profiles').select(cols).eq('id', userId).maybeSingle()),
    supabase.from('service_offers').select('*').eq('user_id', userId),
    supabase.from(JOBS_TABLE).select('*').eq('user_id', userId),
    supabase.from('profile_state').select('account_state').eq('id', userId).maybeSingle(),
  ]);
  const row = profileRows[0] ?? null;
  let accountState = (privateState.data as { account_state?: unknown } | null)?.account_state;
  if (accountState == null && isMissingTable(privateState.error?.message, 'profile_state')) {
    const legacy = await supabase.from('profiles').select('account_state').eq('id', userId).maybeSingle();
    accountState = (legacy.data as { account_state?: unknown } | null)?.account_state;
  }
  return {
    profile: row ? { ...row, account_state: accountState } : null,
    offers: (offers.data as OfferRow[] | null) ?? [],
    jobs: (jobs.data as JobRow[] | null) ?? [],
  };
}

export function catalogFromRows(profiles: ProfileRow[], offers: OfferRow[]): ServiceMaster[] {
  const byUser = new Map<string, OfferRow[]>();
  for (const offer of offers) {
    if (offer.archived) continue;
    const list = byUser.get(offer.user_id) ?? [];
    list.push(offer);
    byUser.set(offer.user_id, list);
  }
  const profileById = new Map(profiles.map((row) => [row.id, row]));
  const masters: ServiceMaster[] = [];
  for (const [userId, rows] of byUser) {
    const userOffers = rows.map((item) => offerFromRow(item)).filter((item) => !item.archived);
    if (!userOffers.length) continue;
    const fallbackName = userOffers[0]?.title.trim() || 'Vakano';
    const row = profileById.get(userId);
    if (row) {
      const profile = profileFromRow(row);
      masters.push({
        ...profile,
        displayName: profile.displayName.trim() || fallbackName,
        avatarUri: profile.avatarUri && isRemoteUri(profile.avatarUri) ? profile.avatarUri : undefined,
        offers: userOffers,
      });
      continue;
    }
    const first = userOffers[0];
    masters.push({
      id: `user:${userId}`,
      displayName: fallbackName,
      bio: '',
      email: '',
      phone: first?.phone ?? '',
      photos: [],
      kinds: first?.kind ? [first.kind] : [],
      customKinds: first?.customKind ? [first.customKind] : [],
      address: first?.address,
      cityId: first?.cityId,
      hours: { ...DEFAULT_HOURS, days: [...DEFAULT_HOURS.days] },
      updatedAt: first?.updatedAt ?? '',
      offers: userOffers,
    });
  }
  return masters;
}

async function fetchProfilesByIds(ids: string[]): Promise<ProfileRow[]> {
  const supabase = getPublicSupabase();
  if (!supabase || !ids.length) return [];
  return selectProfileRows((cols) => supabase.from('profiles').select(cols).in('id', ids));
}

export async function fetchPublicCatalog(_excludeUserId?: string | null): Promise<ServiceMaster[]> {
  const supabase = getPublicSupabase();
  if (!supabase) return [];
  const { data: offers, error } = await supabase
    .from('service_offers')
    .select('*')
    .order('updated_at', { ascending: false })
    .limit(CATALOG_PAGE);
  if (error) throw new Error(error.message);
  const rows = (offers as OfferRow[] | null) ?? [];
  if (!rows.length) return [];
  const ids = [...new Set(rows.map((row) => row.user_id))];
  const profiles = await fetchProfilesByIds(ids);
  return catalogFromRows(profiles, rows);
}

export async function fetchPublicJobs(_excludeUserId?: string | null): Promise<Job[]> {
  const supabase = getPublicSupabase();
  if (!supabase) return [];
  const { data, error } = await supabase.from(JOBS_TABLE).select('*').order('published_at', { ascending: false }).limit(80);
  if (error) throw new Error(error.message);
  return ((data as JobRow[] | null) ?? []).map((row) => jobFromRow(row)).filter((job) => !job.archived);
}

export type { OfferRow, ProfileRow, JobRow };

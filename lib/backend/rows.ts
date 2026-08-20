import { OWN_PROFILE_ID } from '@/lib/store/freelanceSlice';
import { asPlaceId } from '@/lib/places';
import type { ServiceMaster, ServiceOffer, ServiceProfile } from '@/lib/services/types';
import { APP_SOURCE_ID } from '@/lib/tiers';
import type { Job } from '@/lib/types';
import { CATALOG_PAGE, JOBS_TABLE } from './config';
import { getSupabase } from './supabase';

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
    avatarUri: row.avatar_url || undefined,
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
    kind: row.kind as ServiceOffer['kind'],
    customKind: row.custom_kind || undefined,
    featured: row.featured,
    archived: Boolean(row.archived),
    updatedAt: row.updated_at,
  };
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
  const [profile, offers, jobs] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', userId).maybeSingle(),
    supabase.from('service_offers').select('*').eq('user_id', userId),
    supabase.from(JOBS_TABLE).select('*').eq('user_id', userId),
  ]);
  return {
    profile: (profile.data as ProfileRow | null) ?? null,
    offers: (offers.data as OfferRow[] | null) ?? [],
    jobs: (jobs.data as JobRow[] | null) ?? [],
  };
}

export async function fetchPublicCatalog(excludeUserId?: string | null): Promise<ServiceMaster[]> {
  const supabase = getSupabase();
  if (!supabase) return [];
  let query = supabase
    .from('profiles')
    .select('*')
    .neq('display_name', '')
    .order('updated_at', { ascending: false })
    .limit(CATALOG_PAGE);
  if (excludeUserId) query = query.neq('id', excludeUserId);
  const { data: profiles } = await query;
  const rows = (profiles as ProfileRow[] | null) ?? [];
  if (!rows.length) return [];
  const ids = rows.map((row) => row.id);
  const { data: offers } = await supabase.from('service_offers').select('*').in('user_id', ids);
  const byUser = new Map<string, OfferRow[]>();
  for (const offer of (offers as OfferRow[] | null) ?? []) {
    const list = byUser.get(offer.user_id) ?? [];
    list.push(offer);
    byUser.set(offer.user_id, list);
  }
  return rows.map((row) => ({
    ...profileFromRow(row),
    offers: (byUser.get(row.id) ?? []).map((item) => offerFromRow(item)).filter((item) => !item.archived),
  }));
}

export async function fetchPublicJobs(excludeUserId?: string | null): Promise<Job[]> {
  const supabase = getSupabase();
  if (!supabase) return [];
  let query = supabase.from(JOBS_TABLE).select('*').order('published_at', { ascending: false }).limit(80);
  if (excludeUserId) query = query.neq('user_id', excludeUserId);
  const { data } = await query;
  return ((data as JobRow[] | null) ?? []).map((row) => jobFromRow(row)).filter((job) => !job.archived);
}

export type { OfferRow, ProfileRow, JobRow };

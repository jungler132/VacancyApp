-- City/country ids for filters. Paste into Supabase SQL editor.

alter table public.profiles
  add column if not exists city_id text;

alter table public.service_offers
  add column if not exists city_id text;

alter table public.workly_jobs
  add column if not exists city_id text;

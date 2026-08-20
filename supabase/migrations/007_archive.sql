-- Archive flag for own jobs and offers. Paste into Supabase SQL editor.

alter table public.workly_jobs
  add column if not exists archived boolean not null default false;

alter table public.service_offers
  add column if not exists archived boolean not null default false;

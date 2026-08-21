-- Paste into Supabase SQL Editor. Skips tables that do not exist.
-- Jobs table in this project is vakano_jobs (not workly_jobs).

alter table public.profiles
  add column if not exists city_id text,
  add column if not exists company_name text not null default '',
  add column if not exists company_logo text,
  add column if not exists company_about text not null default '';

alter table public.service_offers
  add column if not exists city_id text;

do $$ begin
  if to_regclass('public.vakano_jobs') is not null then
    alter table public.vakano_jobs add column if not exists city_id text;
  elsif to_regclass('public.workly_jobs') is not null then
    alter table public.workly_jobs add column if not exists city_id text;
  end if;
end $$;

notify pgrst, 'reload schema';

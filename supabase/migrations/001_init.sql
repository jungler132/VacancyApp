-- Vakano free backend. Paste into Supabase SQL editor.
-- URL config: Site URL vakano://  Redirect vakano://auth/callback
-- Dashboard: Authentication → Providers → Email (OTP) + Anonymous on.
-- Storage: create public bucket `media` (this script also upserts it).

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users on delete cascade,
  display_name text not null default '',
  bio text not null default '',
  avatar_url text,
  email text not null default '',
  phone text not null default '',
  kinds text[] not null default '{}',
  custom_kinds text[] not null default '{}',
  address text,
  hours_open text not null default '09:00',
  hours_close text not null default '18:00',
  hours_days smallint[] not null default '{1,2,3,4,5}',
  seeking boolean not null default true,
  available boolean not null default false,
  seek_title text not null default '',
  seek_format text not null default 'any',
  account_state jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.service_offers (
  id text not null,
  user_id uuid not null references auth.users on delete cascade,
  title text not null,
  description text not null default '',
  price text,
  currency text not null default 'RUB',
  images text[] not null default '{}',
  address text,
  phone text,
  kind text not null,
  custom_kind text,
  featured boolean not null default false,
  updated_at timestamptz not null default now(),
  primary key (user_id, id)
);

create table if not exists public.workly_jobs (
  id text not null,
  user_id uuid not null references auth.users on delete cascade,
  title text not null,
  company text not null,
  company_logo text,
  location text not null default '',
  remote boolean not null default false,
  salary text,
  employment text,
  experience text,
  schedule text,
  category text,
  published_at timestamptz,
  url text not null default '',
  excerpt text not null default '',
  description text,
  tier smallint not null default 2,
  contact text,
  updated_at timestamptz not null default now(),
  primary key (user_id, id)
);

create index if not exists profiles_updated_idx on public.profiles (updated_at desc);
create index if not exists offers_user_idx on public.service_offers (user_id);
create index if not exists jobs_published_idx on public.workly_jobs (published_at desc);

alter table public.profiles enable row level security;
alter table public.service_offers enable row level security;
alter table public.workly_jobs enable row level security;

drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles for select using (true);
drop policy if exists profiles_write on public.profiles;
create policy profiles_write on public.profiles for all using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists offers_select on public.service_offers;
create policy offers_select on public.service_offers for select using (true);
drop policy if exists offers_write on public.service_offers;
create policy offers_write on public.service_offers for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists jobs_select on public.workly_jobs;
create policy jobs_select on public.workly_jobs for select using (true);
drop policy if exists jobs_write on public.workly_jobs;
create policy jobs_write on public.workly_jobs for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

insert into storage.buckets (id, name, public)
values ('media', 'media', true)
on conflict (id) do update set public = true;

drop policy if exists media_read on storage.objects;
create policy media_read on storage.objects for select using (bucket_id = 'media');
drop policy if exists media_write on storage.objects;
create policy media_write on storage.objects for all
  using (bucket_id = 'media' and split_part(name, '/', 1) = auth.uid()::text)
  with check (bucket_id = 'media' and split_part(name, '/', 1) = auth.uid()::text);

alter table public.service_offers drop constraint if exists service_offers_images_cap;
alter table public.service_offers
  add constraint service_offers_images_cap check (coalesce(cardinality(images), 0) <= 25);

create or replace function public.enforce_row_caps()
returns trigger
language plpgsql
as $$
begin
  if tg_table_name = 'service_offers' and tg_op = 'INSERT' then
    if (select count(*) from public.service_offers where user_id = new.user_id) >= 50 then
      raise exception 'offers cap';
    end if;
  elsif tg_table_name = 'workly_jobs' and tg_op = 'INSERT' then
    if (select count(*) from public.workly_jobs where user_id = new.user_id) >= 100 then
      raise exception 'jobs cap';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists service_offers_cap on public.service_offers;
create trigger service_offers_cap before insert on public.service_offers
  for each row execute procedure public.enforce_row_caps();

drop trigger if exists workly_jobs_cap on public.workly_jobs;
create trigger workly_jobs_cap before insert on public.workly_jobs
  for each row execute procedure public.enforce_row_caps();

create table if not exists public.service_reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references auth.users on delete cascade,
  reporter_email text not null default '',
  target_kind text not null,
  target_id text not null,
  target_title text not null default '',
  message text not null,
  created_at timestamptz not null default now(),
  constraint service_reports_message_len check (char_length(message) between 1 and 120),
  constraint service_reports_kind check (target_kind in ('master', 'offer'))
);

create index if not exists service_reports_created_idx on public.service_reports (created_at desc);
create index if not exists service_reports_reporter_created_idx
  on public.service_reports (reporter_id, created_at desc);

alter table public.service_reports enable row level security;

drop policy if exists service_reports_select_own on public.service_reports;
create policy service_reports_select_own on public.service_reports
  for select using (auth.uid() = reporter_id);

drop policy if exists service_reports_insert on public.service_reports;
create policy service_reports_insert on public.service_reports
  for insert with check (
    auth.uid() = reporter_id
    and not exists (
      select 1 from public.service_reports r
      where r.reporter_id = auth.uid()
        and r.created_at > now() - interval '24 hours'
    )
  );

create or replace function public.service_reports_rate_limit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if exists (
    select 1 from public.service_reports
    where reporter_id = new.reporter_id
      and created_at > now() - interval '24 hours'
  ) then
    raise exception 'report_cooldown';
  end if;
  return new;
end;
$$;

drop trigger if exists service_reports_rate_limit on public.service_reports;
create trigger service_reports_rate_limit
before insert on public.service_reports
for each row execute procedure public.service_reports_rate_limit();

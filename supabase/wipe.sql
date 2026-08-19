-- Paste into Supabase → SQL Editor → Run.
-- Wipes Workly users so you can register emails again.
-- Do not DELETE storage.objects here: Dashboard blocks that. Empty the `media` bucket in Storage UI if you want files gone too.

alter table public.profiles
  add column if not exists account_state jsonb not null default '{}'::jsonb;

delete from public.service_offers;
delete from public.workly_jobs;
delete from public.profiles;
delete from auth.users;

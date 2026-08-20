-- Paste into Supabase → SQL Editor → Run.
-- Wipes Vakano users so you can register emails again.
-- Do not DELETE storage.objects here: Dashboard blocks that. Empty the `media` bucket in Storage UI if you want files gone too.

alter table public.profiles
  add column if not exists account_state jsonb not null default '{}'::jsonb;

delete from public.service_offers;
do $$ begin
  if to_regclass('public.vakano_jobs') is not null then
    delete from public.vakano_jobs;
  end if;
  if to_regclass('public.workly_jobs') is not null then
    delete from public.workly_jobs;
  end if;
end $$;
delete from public.profiles;
delete from auth.users;

-- FULL RESET. Paste into Supabase → SQL Editor → Run.
-- Drops all users, offers, jobs, reports and private state.
-- Schema / RLS stay. You can register the same emails again.

delete from public.service_reports;
delete from public.service_offers;

do $$ begin
  if to_regclass('public.profile_state') is not null then
    delete from public.profile_state;
  end if;
  if to_regclass('public.vakano_jobs') is not null then
    delete from public.vakano_jobs;
  end if;
  if to_regclass('public.workly_jobs') is not null then
    delete from public.workly_jobs;
  end if;
end $$;

delete from public.profiles;

do $$ begin
  delete from storage.objects where bucket_id = 'media';
exception when others then
  raise notice 'storage.objects skipped: %', sqlerrm;
end $$;

delete from auth.users;

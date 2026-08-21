-- FULL RESET. Сначала полностью закрой Vakano на телефоне.
-- Paste into Supabase → SQL Editor → Run.
-- Файлы в Storage: Dashboard → Storage → media → Empty bucket.

begin;

set local row_security = off;

delete from public.service_reports;
delete from public.service_offers;
truncate table public.profile_state;
delete from public.profiles;

do $$ begin
  if to_regclass('public.vakano_jobs') is not null then
    execute 'truncate table public.vakano_jobs';
  end if;
  if to_regclass('public.workly_jobs') is not null then
    execute 'truncate table public.workly_jobs';
  end if;
end $$;

do $$ begin
  perform storage.empty_bucket('media');
exception when others then
  raise notice 'storage skipped: %', sqlerrm;
end $$;

delete from auth.refresh_tokens;
delete from auth.sessions;
delete from auth.identities;
delete from auth.users;

commit;

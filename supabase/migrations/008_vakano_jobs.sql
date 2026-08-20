-- Rebrand: workly_jobs → vakano_jobs. Idempotent if already renamed.

do $$ begin
  if to_regclass('public.workly_jobs') is not null and to_regclass('public.vakano_jobs') is null then
    alter table public.workly_jobs rename to vakano_jobs;
  end if;
end $$;

create or replace function public.enforce_row_caps()
returns trigger
language plpgsql
as $$
begin
  if tg_table_name = 'service_offers' and tg_op = 'INSERT' then
    if (select count(*) from public.service_offers where user_id = new.user_id) >= 50 then
      raise exception 'offers cap';
    end if;
  elsif tg_table_name = 'vakano_jobs' and tg_op = 'INSERT' then
    if (select count(*) from public.vakano_jobs where user_id = new.user_id) >= 100 then
      raise exception 'jobs cap';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists workly_jobs_cap on public.vakano_jobs;
drop trigger if exists vakano_jobs_cap on public.vakano_jobs;
create trigger vakano_jobs_cap before insert on public.vakano_jobs
  for each row execute procedure public.enforce_row_caps();

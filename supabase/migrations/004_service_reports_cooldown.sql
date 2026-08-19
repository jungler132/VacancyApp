-- One report per signed-in user per 24 hours. Paste into Supabase SQL editor.

create index if not exists service_reports_reporter_created_idx
  on public.service_reports (reporter_id, created_at desc);

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

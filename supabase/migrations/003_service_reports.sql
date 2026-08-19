-- Reports from signed-in users. Paste into Supabase SQL editor.

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

alter table public.service_reports enable row level security;

drop policy if exists service_reports_insert on public.service_reports;
create policy service_reports_insert on public.service_reports
  for insert with check (auth.uid() = reporter_id);

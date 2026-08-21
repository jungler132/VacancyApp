-- Move kanban/filters/alerts off the public profiles row.
-- Idempotent: safe to run twice.

create table if not exists public.profile_state (
  id uuid primary key references auth.users on delete cascade,
  account_state jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.profile_state enable row level security;

drop policy if exists profile_state_select on public.profile_state;
create policy profile_state_select on public.profile_state
  for select using (auth.uid() = id);

drop policy if exists profile_state_write on public.profile_state;
create policy profile_state_write on public.profile_state
  for all using (auth.uid() = id) with check (auth.uid() = id);

grant select, insert, update, delete on table public.profile_state to authenticated;

do $$ begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'profiles' and column_name = 'account_state'
  ) then
    insert into public.profile_state (id, account_state, updated_at)
    select id, account_state, updated_at
    from public.profiles
    where account_state is not null
    on conflict (id) do update
      set account_state = excluded.account_state,
          updated_at = excluded.updated_at;
    alter table public.profiles drop column account_state;
  end if;
end $$;

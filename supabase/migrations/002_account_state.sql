-- Private per-email snapshot: theme, locale, font, kanban, filters, alerts.
alter table public.profiles
  add column if not exists account_state jsonb not null default '{}'::jsonb;

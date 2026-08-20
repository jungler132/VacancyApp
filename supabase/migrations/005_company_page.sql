-- Company brand on the same profile as services. Paste into Supabase SQL editor.

alter table public.profiles
  add column if not exists company_name text not null default '',
  add column if not exists company_logo text,
  add column if not exists company_about text not null default '';

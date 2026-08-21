-- Catalog is public: guest, email, Google all SELECT the same rows.
-- Writes stay owner-only. Do not use FOR ALL on write policies (it also covers SELECT).

grant usage on schema public to anon, authenticated;
grant select on table public.profiles to anon, authenticated;
grant select on table public.service_offers to anon, authenticated;
grant insert, update, delete on table public.profiles to authenticated;
grant insert, update, delete on table public.service_offers to authenticated;

drop policy if exists profiles_select on public.profiles;
drop policy if exists profiles_write on public.profiles;
drop policy if exists profiles_insert on public.profiles;
drop policy if exists profiles_update on public.profiles;
drop policy if exists profiles_delete on public.profiles;
create policy profiles_select on public.profiles
  for select to anon, authenticated using (true);
create policy profiles_insert on public.profiles
  for insert to authenticated with check (auth.uid() = id);
create policy profiles_update on public.profiles
  for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);
create policy profiles_delete on public.profiles
  for delete to authenticated using (auth.uid() = id);

drop policy if exists offers_select on public.service_offers;
drop policy if exists offers_write on public.service_offers;
drop policy if exists offers_insert on public.service_offers;
drop policy if exists offers_update on public.service_offers;
drop policy if exists offers_delete on public.service_offers;
create policy offers_select on public.service_offers
  for select to anon, authenticated using (true);
create policy offers_insert on public.service_offers
  for insert to authenticated with check (auth.uid() = user_id);
create policy offers_update on public.service_offers
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy offers_delete on public.service_offers
  for delete to authenticated using (auth.uid() = user_id);

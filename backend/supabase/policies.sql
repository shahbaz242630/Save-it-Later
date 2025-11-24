alter table if exists public.profiles enable row level security;
alter table if exists public.saved_items enable row level security;
alter table if exists public.tags enable row level security;
alter table if exists public.saved_item_tags enable row level security;

create policy if not exists "Profiles are viewable by owner" on public.profiles
  for select using (auth.uid() = id);

create policy if not exists "Profiles are insertable by owner" on public.profiles
  for insert with check (auth.uid() = id);

create policy if not exists "Items are viewable by owner" on public.saved_items
  for select using (auth.uid() = user_id);

create policy if not exists "Items are insertable by owner" on public.saved_items
  for insert with check (auth.uid() = user_id);

create policy if not exists "Items are updatable by owner" on public.saved_items
  for update using (auth.uid() = user_id);

create policy if not exists "Items are deletable by owner" on public.saved_items
  for delete using (auth.uid() = user_id);

create policy if not exists "Tags are viewable by owner" on public.tags
  for select using (auth.uid() = user_id);

create policy if not exists "Tags are insertable by owner" on public.tags
  for insert with check (auth.uid() = user_id);

create policy if not exists "Tags are updatable by owner" on public.tags
  for update using (auth.uid() = user_id);

create policy if not exists "Tags are deletable by owner" on public.tags
  for delete using (auth.uid() = user_id);

create policy if not exists "Saved_item_tags viewable by owner" on public.saved_item_tags
  for select using (
    exists (
      select 1 from public.saved_items si
      where si.id = saved_item_id and si.user_id = auth.uid()
    )
  );

create policy if not exists "Saved_item_tags insertable by owner" on public.saved_item_tags
  for insert with check (
    exists (
      select 1 from public.saved_items si
      where si.id = saved_item_id and si.user_id = auth.uid()
    ) and
    exists (
      select 1 from public.tags t
      where t.id = tag_id and t.user_id = auth.uid()
    )
  );

create policy if not exists "Saved_item_tags deletable by owner" on public.saved_item_tags
  for delete using (
    exists (
      select 1 from public.saved_items si
      where si.id = saved_item_id and si.user_id = auth.uid()
    )
  );

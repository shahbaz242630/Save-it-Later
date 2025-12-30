create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique,
  created_at timestamptz default now()
);

create table if not exists public.saved_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  url text not null,
  title text,
  notes text,
  source_app text,
  domain text,
  favicon_url text,
  preview_image_url text,
  summary text,
  processing_status text default 'complete',
  processing_error text,
  last_enriched_at timestamptz,
  is_favorite boolean default false,
  is_archived boolean default false,
  created_at timestamptz default now()
);

create index if not exists saved_items_user_created_idx on public.saved_items (user_id, created_at desc);
create index if not exists saved_items_domain_idx on public.saved_items (domain);
create index if not exists saved_items_search_idx on public.saved_items using gin (
  to_tsvector('english', coalesce(title,'') || ' ' || coalesce(notes,''))
);

create table if not exists public.tags (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  created_at timestamptz default now(),
  unique (user_id, name)
);

create index if not exists tags_user_idx on public.tags (user_id);

create table if not exists public.saved_item_tags (
  saved_item_id uuid references public.saved_items(id) on delete cascade,
  tag_id uuid references public.tags(id) on delete cascade,
  primary key (saved_item_id, tag_id)
);

create index if not exists saved_item_tags_tag_idx on public.saved_item_tags (tag_id);

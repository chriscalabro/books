-- Books app — initial schema
-- Run this in the Supabase SQL editor (or via the CLI) for your project.
--
-- Access model: a single fixed user. The passphrase screen signs into that one
-- account, and RLS locks every row to auth.uid(). Nothing is world-readable.

-- ---------------------------------------------------------------------------
-- lists: user-editable dropdown options (categories + acquisition methods)
-- ---------------------------------------------------------------------------
create table if not exists public.lists (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  kind        text not null check (kind in ('category', 'acquisition')),
  name        text not null,
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now(),
  unique (user_id, kind, name)
);

-- ---------------------------------------------------------------------------
-- books
-- ---------------------------------------------------------------------------
create table if not exists public.books (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null default auth.uid() references auth.users (id) on delete cascade,
  title        text not null,
  author       text,
  category     text,        -- free text mirror of a lists(kind='category') name
  acquisition  text,        -- free text mirror of a lists(kind='acquisition') name
  pub_date     date,        -- real date; display format is chosen in Settings (e.g. "Sep 2026")
  cover_url    text,
  link         text,
  notes        text,
  source       text not null default 'manual',  -- 'manual' | 'libby_script' | ...
  sort_order   integer not null default 0,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists books_user_idx on public.books (user_id);
create index if not exists books_category_idx on public.books (user_id, category);

-- keep updated_at fresh
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists books_set_updated_at on public.books;
create trigger books_set_updated_at
  before update on public.books
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Row Level Security — every row belongs to, and is visible to, its owner only
-- ---------------------------------------------------------------------------
alter table public.books enable row level security;
alter table public.lists enable row level security;

drop policy if exists "own books" on public.books;
create policy "own books" on public.books
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "own lists" on public.lists;
create policy "own lists" on public.lists
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

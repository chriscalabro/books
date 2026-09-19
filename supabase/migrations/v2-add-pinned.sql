-- Books app — add "pinned" for prioritizing titles to tackle sooner.
-- Safe to run on the existing project; only touches the books table.
alter table public.books
  add column if not exists pinned boolean not null default false;

create index if not exists books_pinned_idx on public.books (user_id, pinned);

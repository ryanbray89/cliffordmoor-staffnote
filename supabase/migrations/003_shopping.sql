-- Shopping list for the yard. Safe to run more than once.
-- The app uses the service role key. Row level security is on and there
-- are no public policies, so the anon key cannot read or write.

create table if not exists public.shopping_items (
  id uuid primary key default gen_random_uuid(),
  item text not null check (char_length(btrim(item)) between 1 and 80),
  quantity text check (quantity is null or (char_length(btrim(quantity)) between 1 and 40)),
  note text check (note is null or char_length(note) <= 500),
  added_by uuid references public.staff (id) on delete set null,
  added_by_name text,
  status text not null default 'needed' check (status in ('needed', 'bought')),
  bought_at timestamptz,
  bought_by_name text,
  created_at timestamptz not null default now(),
  constraint shopping_items_bought_check check (
    (status = 'needed' and bought_at is null and bought_by_name is null)
    or (status = 'bought' and bought_at is not null)
  )
);

create index if not exists shopping_items_added_by_idx on public.shopping_items (added_by);
create index if not exists shopping_items_status_created_idx on public.shopping_items (status, created_at desc);

alter table public.shopping_items enable row level security;

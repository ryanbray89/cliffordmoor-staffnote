-- Stock list. Separate from the shopping list. Safe to run more than once.
-- The app uses the service role key. Row level security is on and there
-- are no public policies, so the anon key cannot read or write.

create table if not exists public.stock_items (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(btrim(name)) between 1 and 80),
  quantity numeric(8, 1) not null default 0 check (quantity >= 0 and quantity <= 9999),
  kennels_note text check (kennels_note is null or char_length(btrim(kennels_note)) between 1 and 80),
  status text not null default 'ok' check (status in ('ok', 'low', 'out')),
  sort_order integer not null default 0,
  updated_by uuid references public.staff (id) on delete set null,
  updated_by_name text,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  constraint stock_items_name_key unique (name)
);

create index if not exists stock_items_updated_by_idx on public.stock_items (updated_by);
create index if not exists stock_items_status_idx on public.stock_items (status, sort_order);

alter table public.stock_items enable row level security;

insert into public.stock_items (name, quantity, kennels_note, status, sort_order, updated_by_name)
values
  ('Wagg 12kg (in freezers)', 2, '1', 'ok', 1, 'Stock take'),
  ('Harringtons 1.7kg bags (in freezers)', 2, null, 'ok', 2, 'Stock take'),
  ('Cat dry food (in freezers)', 0, 'half bag', 'out', 3, 'Stock take'),
  ('Bleach (bottles)', 8, null, 'ok', 4, 'Stock take'),
  ('Washing liquid', 11, null, 'ok', 5, 'Stock take'),
  ('Vira care', 11, null, 'ok', 6, 'Stock take'),
  ('Bacta care', 12, null, 'ok', 7, 'Stock take'),
  ('Cat litter', 3, '1', 'ok', 8, 'Stock take'),
  ('Cat wet food (boxes of 6 cans)', 4, null, 'ok', 9, 'Stock take'),
  ('Dog wet food (boxes)', 0, '1.5 boxes', 'out', 10, 'Stock take'),
  ('Kitchen roll (rolls)', 15, null, 'ok', 11, 'Stock take'),
  ('Loo roll', 0, null, 'out', 12, 'Stock take'),
  ('Washing powder (boxes)', 3, null, 'ok', 13, 'Stock take'),
  ('Bin bags (large rolls)', 2, null, 'ok', 14, 'Stock take'),
  ('Whiteboard markers', 3, null, 'ok', 15, 'Stock take'),
  ('Disposable gloves (boxes)', 1, null, 'low', 16, 'Stock take'),
  ('Plasters (boxes)', 4, null, 'ok', 17, 'Stock take'),
  ('Hand wash', 4, null, 'ok', 18, 'Stock take'),
  ('Blue cloths (packets)', 0.5, null, 'low', 19, 'Stock take')
on conflict (name) do nothing;

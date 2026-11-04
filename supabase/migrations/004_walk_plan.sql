-- Walk plan: which dogs need an extra 30 minute walk, and on which days.
-- Safe to run more than once.
-- The app uses the service role key. Row level security is on and there
-- are no public policies, so the anon key cannot read or write.

create table if not exists public.walk_dogs (
  id uuid primary key default gen_random_uuid(),
  dog_name text not null check (char_length(btrim(dog_name)) between 1 and 60),
  note text check (note is null or char_length(note) <= 120),
  created_by_name text,
  created_at timestamptz not null default now(),
  active boolean not null default true
);

create table if not exists public.walk_days (
  id uuid primary key default gen_random_uuid(),
  walk_dog_id uuid not null references public.walk_dogs (id) on delete cascade,
  walk_date date not null,
  done_at timestamptz,
  done_by uuid references public.staff (id) on delete set null,
  done_by_name text,
  unique (walk_dog_id, walk_date),
  constraint walk_days_done_check check (
    (done_at is null and done_by is null and done_by_name is null)
    or (done_at is not null and done_by_name is not null)
  )
);

create index if not exists walk_days_dog_idx on public.walk_days (walk_dog_id);
create index if not exists walk_days_date_idx on public.walk_days (walk_date);
create index if not exists walk_days_done_by_idx on public.walk_days (done_by);

alter table public.walk_dogs enable row level security;
alter table public.walk_days enable row level security;

-- Clifford Moor Farm Pet Hotel — Staff Note
-- Run this once in the Supabase SQL editor (or via the Supabase CLI).
-- The app uses the service role key on the server. Row level security is on
-- and there are no public policies, so the anon key cannot read or write.

create extension if not exists pgcrypto;

create table if not exists public.staff (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(btrim(name)) between 1 and 40),
  active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.entries (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('extra_job', 'extra_dog_work', 'note')),
  staff_id uuid references public.staff (id) on delete set null,
  staff_name text not null,
  title text not null check (char_length(title) between 1 and 80),
  detail text not null default '',
  dog_name text,
  owner_name text,
  kennel text,
  area text,
  job_state text,
  quantity integer,
  duration_mins integer,
  urgent boolean not null default false,
  happened_on date not null,
  status text not null default 'new' check (status in ('new', 'seen', 'done')),
  charged boolean,
  sample boolean not null default false,
  photo_path text,
  photo_content_type text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint entries_job_state_check check (
    (type = 'extra_job' and job_state in ('done', 'needs_doing'))
    or (type <> 'extra_job' and job_state is null)
  ),
  constraint entries_charged_check check (
    (type = 'extra_dog_work' and charged is not null)
    or (type <> 'extra_dog_work' and charged is null)
  ),
  constraint entries_quantity_check check (
    quantity is null or (quantity >= 1 and quantity <= 20)
  ),
  constraint entries_duration_check check (
    duration_mins is null or duration_mins in (10, 15, 20, 30, 45, 60)
  )
);

create table if not exists public.replies (
  id uuid primary key default gen_random_uuid(),
  entry_id uuid not null references public.entries (id) on delete cascade,
  author_name text not null,
  body text not null check (char_length(btrim(body)) > 0),
  created_at timestamptz not null default now()
);

create index if not exists entries_created_at_idx on public.entries (created_at desc);
create index if not exists entries_happened_on_idx on public.entries (happened_on desc);
create index if not exists entries_status_idx on public.entries (status);
create index if not exists entries_type_idx on public.entries (type);
create index if not exists entries_staff_idx on public.entries (staff_id);
create index if not exists replies_entry_idx on public.replies (entry_id, created_at);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists entries_set_updated_at on public.entries;
create trigger entries_set_updated_at
before update on public.entries
for each row
execute function public.set_updated_at();

alter table public.staff enable row level security;
alter table public.entries enable row level security;
alter table public.replies enable row level security;

insert into storage.buckets (id, name, public)
values ('entry-photos', 'entry-photos', false)
on conflict (id) do nothing;

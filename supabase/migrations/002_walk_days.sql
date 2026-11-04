-- Extra walks: the days a dog is to be walked.
-- Extra job logs can name several tasks, so the title may be longer than 80 characters.
-- Safe to run more than once.

alter table public.entries
  add column if not exists walk_dates date[];

comment on column public.entries.walk_dates is
  'Days an extra walk is booked for (Europe/London calendar dates). Null on older logs, jobs, and notes.';

do $$
declare
  old_title_check text;
begin
  select c.conname into old_title_check
  from pg_constraint c
  where c.conrelid = 'public.entries'::regclass
    and c.contype = 'c'
    and pg_get_constraintdef(c.oid) ilike '%char_length(title)%'
    and pg_get_constraintdef(c.oid) like '%80%'
  limit 1;

  if old_title_check is not null then
    execute format('alter table public.entries drop constraint %I', old_title_check);
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.entries'::regclass
      and conname = 'entries_title_length_check'
  ) then
    alter table public.entries
      add constraint entries_title_length_check
      check (char_length(title) between 1 and 1000);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.entries'::regclass
      and conname = 'entries_walk_dates_check'
  ) then
    alter table public.entries
      add constraint entries_walk_dates_check
      check (
        walk_dates is null
        or (
          cardinality(walk_dates) between 1 and 20
          and cardinality(walk_dates) = quantity
          and array_position(walk_dates, null::date) is null
        )
      );
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.entries'::regclass
      and conname = 'entries_walk_dates_type_check'
  ) then
    alter table public.entries
      add constraint entries_walk_dates_type_check
      check (type = 'extra_dog_work' or walk_dates is null);
  end if;
end $$;

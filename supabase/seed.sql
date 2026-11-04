-- Optional sample team and logs, so the office book is not empty on day one.
-- Safe to run more than once. Remove them later with "Remove the sample logs" in the office.
-- Dates use Europe/London "today".

insert into public.staff (id, name, active, sort_order)
values
  ('11111111-1111-4111-8111-111111111111', 'Ryan', true, 0),
  ('22222222-2222-4222-8222-222222222222', 'Jordanna', true, 1)
on conflict (id) do nothing;

insert into public.entries (
  id, type, staff_id, staff_name, title, detail, dog_name, owner_name, kennel, area,
  job_state, quantity, duration_mins, walk_dates, urgent, happened_on, status, charged, sample, created_at, updated_at
)
values
  (
    '33333333-3333-4333-8333-333333333301',
    'note',
    '11111111-1111-4111-8111-111111111111',
    'Ryan',
    'Maintenance',
    'Heater in kennel 9 is not coming on. The dog has been moved to kennel 15 for tonight.',
    null, null, null, null,
    null, null, null, null, true,
    (timezone('Europe/London', now()))::date,
    'new', null, true,
    now() - interval '10 minutes',
    now() - interval '10 minutes'
  ),
  (
    '33333333-3333-4333-8333-333333333302',
    'extra_dog_work',
    '22222222-2222-4222-8222-222222222222',
    'Jordanna',
    'Bath',
    'Had a bath before collection this afternoon.',
    'Bramble', 'Hale', '12', null,
    null, 1, 30, null, false,
    (timezone('Europe/London', now()))::date,
    'new', false, true,
    now() - interval '25 minutes',
    now() - interval '25 minutes'
  ),
  (
    '33333333-3333-4333-8333-333333333303',
    'note',
    '22222222-2222-4222-8222-222222222222',
    'Jordanna',
    'Customer comment',
    'Mrs Hale said Bramble settled really well and asked us to pass on her thanks.',
    'Bramble', null, null, null,
    null, null, null, null, false,
    (timezone('Europe/London', now()))::date,
    'seen', null, true,
    now() - interval '40 minutes',
    now() - interval '20 minutes'
  ),
  (
    '33333333-3333-4333-8333-333333333304',
    'extra_dog_work',
    '11111111-1111-4111-8111-111111111111',
    'Ryan',
    'Medication',
    'Morning tablet given, as on the chart.',
    'Alfie', null, '4', null,
    null, 1, null, null, false,
    (timezone('Europe/London', now()))::date,
    'seen', false, true,
    now() - interval '2 hours',
    now() - interval '90 minutes'
  ),
  (
    '33333333-3333-4333-8333-333333333305',
    'extra_job',
    '11111111-1111-4111-8111-111111111111',
    'Ryan',
    'Mend paddock 2 gate latch',
    'The latch is loose. Dogs are still secure, but it needs sorting today.',
    null, null, null, 'Paddocks',
    'needs_doing', null, null, null, true,
    (timezone('Europe/London', now()))::date,
    'new', null, true,
    now() - interval '3 hours',
    now() - interval '3 hours'
  ),
  (
    '33333333-3333-4333-8333-333333333306',
    'extra_dog_work',
    '22222222-2222-4222-8222-222222222222',
    'Jordanna',
    'Extra walk',
    'Owner asked for an extra lunchtime walk.',
    'Mabel', 'Carter', '7', null,
    null, 2, 30,
    array[
      (timezone('Europe/London', now()))::date - 1,
      (timezone('Europe/London', now()))::date
    ]::date[],
    false,
    (timezone('Europe/London', now()))::date - 1,
    'new', false, true,
    now() - interval '26 hours',
    now() - interval '26 hours'
  ),
  (
    '33333333-3333-4333-8333-333333333307',
    'extra_job',
    '22222222-2222-4222-8222-222222222222',
    'Jordanna',
    'Laundry',
    'Kennel blankets through the wash.',
    null, null, null, 'Laundry',
    'done', null, null, null, false,
    (timezone('Europe/London', now()))::date - 1,
    'done', null, true,
    now() - interval '32 hours',
    now() - interval '30 hours'
  )
on conflict (id) do nothing;

insert into public.replies (id, entry_id, author_name, body, created_at)
values (
  '44444444-4444-4444-8444-444444444401',
  '33333333-3333-4333-8333-333333333303',
  'Ryan',
  'Lovely. I''ll mention it when they collect.',
  now() - interval '20 minutes'
)
on conflict (id) do nothing;

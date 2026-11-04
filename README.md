# Clifford Moor Farm — Staff Note

A phone-first log for the kennel team at Clifford Moor Farm Pet Hotel. Staff tap their name and record extra jobs, extra dog work, or a note for Ryan. The office is where those logs are read, marked, replied to, and exported for billing.

There are no staff logins. The office is locked with a PIN.

## What the yard sees

Open the app, tap a name, and this phone remembers it. Three logs:

- **Extra job** — something done around the site, or something that still needs doing.
- **Extra dog work** — an extra walk, medication, bath, nail trim, or similar, against a dog. Optional owner, kennel, quantity, and time.
- **Note for Ryan** — an issue, maintenance, a customer comment, or a concern. Can be marked urgent, and can include a photo.

Replies from the office show on that person’s screen the next time they open the app.

## What the office sees

`/admin` asks for the PIN (`ADMIN_PIN`). From there you can:

- Read the inbox, with a count of anything still **New**.
- Filter by type, status, team member, dog, date, billing (charged / not charged), and jobs that still need doing.
- Mark each log **New**, **Seen**, or **Done**. Replying marks a new log as seen.
- Mark dog work **Charged** or **Not charged**.
- Reply. The reply shows on the yard screen under that person’s name, as from Ryan.
- Download a CSV of the current view (or everything, from the nav). Dates are UK format, times are Europe/London, and the file opens in Excel.
- Add, rename, hide, and reorder the team. Hidden names stay on old logs.

Sample logs are included so Staff Note is not empty. Remove them from the inbox before you bill from a CSV.

## Run it on your computer

You need Node.js 20 or newer.

```bash
npm install
cp .env.example .env.local
npm run dev
```

The app is at [http://127.0.0.1:43123](http://127.0.0.1:43123).

The starter office PIN in `.env.example` is `2468`. Change `ADMIN_PIN` in `.env.local` before anyone else can open the office. Restart the dev server after you change it.

With Supabase left blank, logs and photos are saved in `data/` on this computer (`data/staff-note.json` and `data/photos/`). That folder is not committed. The first run seeds Ryan, Jordanna, and a few sample logs.

```bash
npm test
npm run lint
```

## Environment variables

| Variable | Required | What it is |
| --- | --- | --- |
| `ADMIN_PIN` | Yes, for the office | PIN or password, at least 4 characters. Staff never use it. |
| `SUPABASE_URL` | On Vercel | Project URL, like `https://xxxx.supabase.co`. |
| `SUPABASE_SERVICE_ROLE_KEY` | On Vercel | Service role key. Server only. |

Leave both Supabase variables empty to use the local file store. Set both, or neither. Do not put the service role key in a `NEXT_PUBLIC_` variable. The browser never talks to Supabase, so the anon key is not used. Row level security is enabled with no public policies, which blocks the anon key if it ever leaks.

## Supabase

In the Supabase SQL editor, run:

1. `supabase/migrations/001_init.sql` — tables, the updated-at trigger, locked-down row level security, and a private Storage bucket named `entry-photos`.
2. `supabase/seed.sql` — optional. Adds Ryan, Jordanna, and the sample logs. Safe to run twice.

If the bucket insert does not apply, create a **private** bucket called `entry-photos` in Storage yourself.

Then set `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` and restart. Photos go in that bucket. The app serves them through `/api/photos/...` so the bucket can stay private.

## Deploy on Vercel

The disk on Vercel is temporary. A deploy without Supabase will lose logs. Set the three environment variables on the project, run the SQL above, then deploy. `npm run build` is the production build.

Times are stored in UTC and shown in **Europe/London**. “Today” on a log follows the yard’s clock, not the phone’s timezone setting.

## A note on access

Staff are not asked to sign in, which is the point of the yard screen. Anyone with the link can pick a name and add a log, and a photo can be opened if its address is known. The PIN protects the inbox, replies, status, billing, CSV export, and the team list.

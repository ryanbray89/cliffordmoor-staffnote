import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { clearSamples } from "@/lib/actions";
import { openBook } from "@/lib/book";
import { isAdmin } from "@/lib/session";
import { EntryCard } from "@/components/entry-card";
import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { exportHref, hasFilters, inboxHref, parseFilters } from "@/lib/filters";
import type { Filters } from "@/lib/types";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Office book" };

function Chip({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "inline-flex h-11 shrink-0 items-center rounded-full px-4 text-sm font-semibold",
        active ? "bg-primary text-primary-foreground" : "bg-card text-foreground ring-1 ring-border",
      )}
    >
      {children}
    </Link>
  );
}

function patch(filters: Filters, next: Partial<Filters>) {
  return inboxHref({ ...filters, ...next });
}

export default async function InboxPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  if (!(await isAdmin())) redirect("/admin/login");
  const params = await searchParams;
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    const single = Array.isArray(value) ? value[0] : value;
    if (single) query.set(key, single);
  }
  const filters = parseFilters(query);
  const book = await openBook();
  if (!book.ok) return null;

  const [entries, staff, samples] = await Promise.all([
    book.store.listEntries(filters, 500),
    book.store.listStaff({ includeInactive: true }),
    book.store.countSample(),
  ]);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-heading text-3xl tracking-tight">Inbox</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {entries.length === 500 ? "Latest 500 in this view." : `${entries.length} in this view.`}
          </p>
        </div>
        <a
          href={exportHref(filters)}
          className={buttonVariants({ className: "h-12 rounded-full px-5 text-base" })}
        >
          Download this view
        </a>
      </div>

      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
        <Chip href={patch(filters, { type: "all" })} active={filters.type === "all"}>
          All
        </Chip>
        <Chip href={patch(filters, { type: "extra_job" })} active={filters.type === "extra_job"}>
          Jobs
        </Chip>
        <Chip href={patch(filters, { type: "extra_dog_work" })} active={filters.type === "extra_dog_work"}>
          Dog work
        </Chip>
        <Chip href={patch(filters, { type: "note" })} active={filters.type === "note"}>
          Notes
        </Chip>
      </div>
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
        <Chip href={patch(filters, { status: "all" })} active={filters.status === "all"}>
          Any status
        </Chip>
        <Chip href={patch(filters, { status: "new" })} active={filters.status === "new"}>
          New
        </Chip>
        <Chip href={patch(filters, { status: "seen" })} active={filters.status === "seen"}>
          Seen
        </Chip>
        <Chip href={patch(filters, { status: "done" })} active={filters.status === "done"}>
          Done
        </Chip>
        <Chip href={patch(filters, { needsDoing: !filters.needsDoing })} active={filters.needsDoing}>
          Needs doing
        </Chip>
      </div>
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
        <Chip href={patch(filters, { charged: "all" })} active={filters.charged === "all"}>
          Any billing
        </Chip>
        <Chip href={patch(filters, { charged: "not_charged" })} active={filters.charged === "not_charged"}>
          Not charged
        </Chip>
        <Chip href={patch(filters, { charged: "charged" })} active={filters.charged === "charged"}>
          Charged
        </Chip>
      </div>

      <details className="rounded-2xl bg-card p-4 ring-1 ring-border">
        <summary className="cursor-pointer text-base font-semibold">Dates, dog, team</summary>
        <form action="/admin" method="get" className="mt-4 grid gap-3 sm:grid-cols-2">
          {filters.type !== "all" ? <input type="hidden" name="type" value={filters.type} /> : null}
          {filters.status !== "all" ? <input type="hidden" name="status" value={filters.status} /> : null}
          {filters.charged !== "all" ? <input type="hidden" name="charged" value={filters.charged} /> : null}
          {filters.needsDoing ? <input type="hidden" name="needs" value="1" /> : null}
          <label className="flex flex-col gap-1 text-sm font-medium">
            Team
            <select
              name="staff"
              defaultValue={filters.staffId}
              className="h-12 rounded-2xl border border-input bg-card px-3 text-base"
            >
              <option value="all">Everyone</option>
              {staff.map((person) => (
                <option key={person.id} value={person.id}>
                  {person.name}
                  {person.active ? "" : " (hidden)"}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm font-medium">
            Dog
            <Input name="dog" defaultValue={filters.dog} placeholder="Name" className="h-12 rounded-2xl bg-card px-3 text-base md:text-base" />
          </label>
          <label className="flex flex-col gap-1 text-sm font-medium">
            From
            <Input type="date" name="from" defaultValue={filters.from} className="h-12 rounded-2xl bg-card px-3 text-base md:text-base" />
          </label>
          <label className="flex flex-col gap-1 text-sm font-medium">
            To
            <Input type="date" name="to" defaultValue={filters.to} className="h-12 rounded-2xl bg-card px-3 text-base md:text-base" />
          </label>
          <div className="flex flex-wrap items-center gap-3 sm:col-span-2">
            <button type="submit" className={buttonVariants({ className: "h-12 rounded-full px-5" })}>
              Apply filters
            </button>
            {hasFilters(filters) ? (
              <Link href="/admin" className="text-sm font-semibold underline underline-offset-4">
                Clear filters
              </Link>
            ) : null}
          </div>
        </form>
      </details>

      {samples > 0 ? (
        <form action={clearSamples} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-straw px-4 py-3">
          <p className="text-sm">Sample logs are in Staff Note so you can see how it works. They are included in a CSV until you remove them.</p>
          <button type="submit" className={buttonVariants({ variant: "outline", className: "h-11 rounded-full bg-card px-4" })}>
            Remove sample logs
          </button>
        </form>
      ) : null}

      {entries.length === 0 ? (
        <p className="rounded-2xl bg-card px-5 py-8 text-center text-base text-muted-foreground ring-1 ring-border">
          {hasFilters(filters)
            ? "Nothing matches those filters."
            : "Nothing in Staff Note yet. When the yard logs a job, it lands here."}
        </p>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {entries.map((entry) => (
            <EntryCard key={entry.id} entry={entry} />
          ))}
        </div>
      )}
    </div>
  );
}

import { ChevronRight, ClipboardList, Dog, MessageSquareText, ShoppingBasket } from "lucide-react";
import Link from "next/link";

import { chooseStaff, clearStaff } from "@/lib/actions";
import { openBook } from "@/lib/book";
import { LOG_PATHS, logLabel } from "@/lib/catalog";
import { EMPTY_FILTERS, one } from "@/lib/filters";
import { getCurrentStaff } from "@/lib/session";
import { formatLongDate, greetingForHour, londonHour, londonToday } from "@/lib/time";
import { walksOn } from "@/lib/walks";
import type { Entry } from "@/lib/types";
import { BrandLockup } from "@/components/brand";
import { Shell } from "@/components/shell";
import { StaffEntry } from "@/components/staff-entry";
import { StorageBanner } from "@/components/storage-banner";
import { Button } from "@/components/ui/button";

function latestReply(entry: Entry) {
  return entry.replies[entry.replies.length - 1];
}

export default async function Home({ searchParams }: PageProps<"/">) {
  const params = await searchParams;
  const book = await openBook();
  const today = londonToday();
  const saved = one(params.saved).slice(0, 140);
  const needName = one(params.needName) === "1";
  const missingName = one(params.pick) === "1";

  if (!book.ok) {
    return (
      <Shell home="yard">
        <BrandLockup title="Staff Note" />
        <p role="alert" className="mt-6 rounded-2xl bg-card p-5 ring-1 ring-border">
          {book.message}
        </p>
      </Shell>
    );
  }

  const [people, current] = await Promise.all([
    book.store.listStaff(),
    getCurrentStaff(),
  ]);

  let mine: Entry[] = [];
  let neededCount = 0;
  let walksLeft = 0;
  if (current) {
    const [logs, shopping, plan] = await Promise.all([
      book.store.listEntries({ ...EMPTY_FILTERS, staffId: current.id }, 12),
      book.store.listShopping(),
      book.store.listWalkPlan(),
    ]);
    mine = logs;
    neededCount = shopping.filter((item) => item.status === "needed").length;
    walksLeft = walksOn(plan, londonToday()).filter((row) => !row.day.doneAt).length;
  }
  const replies = mine
    .filter((entry) => entry.replies.length > 0)
    .sort((a, b) => latestReply(b).createdAt.localeCompare(latestReply(a).createdAt));

  return (
    <Shell home="yard">
      <div className="flex flex-col gap-6">
        <BrandLockup title="Staff Note" />
        <StorageBanner mode={book.mode} onlyDanger />

        {current ? (
          <div className="flex items-end justify-between gap-3">
            <div>
              <h1 className="font-heading text-3xl leading-tight tracking-tight">
                {greetingForHour(londonHour())}, {current.name}
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">{formatLongDate(today)}</p>
            </div>
            <form action={clearStaff}>
              <button type="submit" className="h-11 text-sm font-semibold underline underline-offset-4">
                Switch
              </button>
            </form>
          </div>
        ) : (
          <div>
            <h1 className="font-heading text-3xl leading-tight tracking-tight">Who&apos;s logging?</h1>
            <p className="mt-2 text-base text-muted-foreground">
              Tap your name. This phone will remember it.
            </p>
          </div>
        )}

        {saved ? (
          <p role="status" className="rounded-2xl bg-accent px-4 py-3 text-base font-medium text-accent-foreground">
            Saved. {saved} is in Staff Note.
          </p>
        ) : null}
        {needName ? (
          <p role="alert" className="rounded-2xl bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive">
            Tap your name first, then you can log it.
          </p>
        ) : null}
        {missingName ? (
          <p role="alert" className="rounded-2xl bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive">
            That name is not on the yard list any more.
          </p>
        ) : null}

        {!current && people.length === 0 ? (
          <p className="rounded-2xl bg-card p-5 ring-1 ring-border">
            No names yet. Ask Ryan to add the team in the office book.
          </p>
        ) : null}

        {!current && people.length > 0 ? (
          <ul className="flex flex-col gap-3">
            {people.map((person) => (
              <li key={person.id}>
                <form action={chooseStaff}>
                  <input type="hidden" name="staffId" value={person.id} />
                  <Button
                    type="submit"
                    variant="outline"
                    className="h-16 w-full justify-between rounded-2xl bg-card px-5 text-xl font-semibold whitespace-normal"
                  >
                    {person.name}
                    <ChevronRight className="size-5 text-muted-foreground" />
                  </Button>
                </form>
              </li>
            ))}
          </ul>
        ) : null}

        {current && replies.length > 0 ? (
          <section className="flex flex-col gap-3" aria-label="Replies from Ryan">
            {replies.slice(0, 2).map((entry) => {
              const reply = latestReply(entry);
              return (
                <a key={reply.id} href="#recent" className="rounded-2xl bg-straw px-4 py-4 ring-1 ring-border">
                  <p className="text-sm font-semibold">Ryan replied</p>
                  <p className="mt-1 text-base">{reply.body}</p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    On {logLabel(entry)}
                  </p>
                </a>
              );
            })}
          </section>
        ) : null}

        {current ? (
          <section className="flex flex-col gap-3" aria-label="Log something">
            <Link
              href={LOG_PATHS.job}
              className="flex min-h-24 items-center gap-4 rounded-2xl bg-card px-4 py-4 shadow-sm ring-1 ring-border active:bg-accent"
            >
              <span className="flex size-12 items-center justify-center rounded-2xl bg-accent text-primary">
                <ClipboardList className="size-6" />
              </span>
              <span>
                <span className="block text-lg font-semibold">Extra job</span>
                <span className="block text-sm text-muted-foreground">Something done, or that needs doing</span>
              </span>
            </Link>
            <Link
              href="/walks"
              className="flex min-h-24 items-center gap-4 rounded-2xl bg-card px-4 py-4 shadow-sm ring-1 ring-border active:bg-accent"
            >
              <span className="flex size-12 items-center justify-center rounded-2xl bg-accent text-primary">
                <Dog className="size-6" />
              </span>
              <span>
                <span className="block text-lg font-semibold">Extra walk</span>
                <span className="block text-sm text-muted-foreground">
                  {walksLeft > 0 ? `${walksLeft} still to walk` : "Who needs a walk today"}
                </span>
              </span>
            </Link>
            <Link
              href={LOG_PATHS.note}
              className="flex min-h-24 items-center gap-4 rounded-2xl bg-card px-4 py-4 shadow-sm ring-1 ring-border active:bg-accent"
            >
              <span className="flex size-12 items-center justify-center rounded-2xl bg-accent text-primary">
                <MessageSquareText className="size-6" />
              </span>
              <span>
                <span className="block text-lg font-semibold">Note for Ryan</span>
                <span className="block text-sm text-muted-foreground">Issues, maintenance, customer comments</span>
              </span>
            </Link>
            <Link
              href="/shopping"
              className="flex min-h-24 items-center gap-4 rounded-2xl bg-card px-4 py-4 shadow-sm ring-1 ring-border active:bg-accent"
            >
              <span className="flex size-12 items-center justify-center rounded-2xl bg-accent text-primary">
                <ShoppingBasket className="size-6" />
              </span>
              <span>
                <span className="block text-lg font-semibold">Shopping list</span>
                <span className="block text-sm text-muted-foreground">
                  {neededCount > 0 ? `${neededCount} still to buy` : "Things the yard needs"}
                </span>
              </span>
            </Link>
          </section>
        ) : null}

        {current ? (
          <section id="recent" className="flex flex-col gap-3">
            <h2 className="font-heading text-2xl">Your recent logs</h2>
            {mine.length === 0 ? (
              <p className="text-base text-muted-foreground">Nothing logged under your name yet.</p>
            ) : (
              mine.map((entry) => <StaffEntry key={entry.id} entry={entry} />)
            )}
          </section>
        ) : null}
      </div>
    </Shell>
  );
}

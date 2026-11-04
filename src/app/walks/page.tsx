import { ChevronLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { WalkChecklist } from "@/components/walk-checklist";
import { Shell } from "@/components/shell";
import { openBook } from "@/lib/book";
import { getCurrentStaff } from "@/lib/session";
import { londonToday } from "@/lib/time";
import { clampWalkDay, walksOn } from "@/lib/walks";

export const metadata: Metadata = { title: "Today's walks" };

export default async function WalksPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const staff = await getCurrentStaff();
  if (!staff) redirect("/?needName=1");
  const params = await searchParams;
  const today = londonToday();
  const requested = Array.isArray(params.day) ? params.day[0] : params.day;
  const day = clampWalkDay(requested ?? "", today);
  const book = await openBook();
  const plan = book.ok ? await book.store.listWalkPlan() : [];

  return (
    <Shell>
      <div className="mb-5">
        <Link href="/" className="inline-flex h-11 items-center gap-1 text-base font-semibold">
          <ChevronLeft className="size-5" />
          Staff Note
        </Link>
      </div>
      <h1 className="font-heading text-3xl tracking-tight">Extra walks</h1>
      <p className="mt-2 mb-6 text-base text-muted-foreground">Who needs a 30 minute walk, and who has been walked.</p>
      {!book.ok ? (
        <p role="alert" className="rounded-2xl bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {book.message}
        </p>
      ) : (
        <WalkChecklist
          source="yard"
          day={day}
          today={today}
          rows={walksOn(plan, day)}
          todayLeft={walksOn(plan, today).filter((row) => !row.day.doneAt).length}
        />
      )}
    </Shell>
  );
}

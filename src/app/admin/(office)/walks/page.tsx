import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { WalkChecklist } from "@/components/walk-checklist";
import { openBook } from "@/lib/book";
import { isAdmin } from "@/lib/session";
import { londonToday } from "@/lib/time";
import { clampWalkDay, walksOn } from "@/lib/walks";

export const metadata: Metadata = { title: "Walks" };

export default async function OfficeWalksPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  if (!(await isAdmin())) redirect("/admin/login");
  const params = await searchParams;
  const today = londonToday();
  const requested = Array.isArray(params.day) ? params.day[0] : params.day;
  const day = clampWalkDay(requested ?? "", today);
  const book = await openBook();
  if (!book.ok) return null;
  const plan = await book.store.listWalkPlan();

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="font-heading text-3xl tracking-tight">Walks</h1>
        <p className="mt-1 text-sm text-muted-foreground">30 minute extra walks. Who still needs one, and who has been walked.</p>
      </div>
      <WalkChecklist
        source="office"
        day={day}
        today={today}
        rows={walksOn(plan, day)}
        todayLeft={walksOn(plan, today).filter((row) => !row.day.doneAt).length}
      />
    </div>
  );
}

import { ChevronLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { removeWalkDog } from "@/lib/actions";
import { WalkPlanForm } from "@/components/walk-plan-form";
import { Button } from "@/components/ui/button";
import { openBook } from "@/lib/book";
import { isAdmin } from "@/lib/session";
import { londonToday } from "@/lib/time";
import { clampWalkDay } from "@/lib/walks";

export const metadata: Metadata = { title: "Walk days" };

export default async function OfficeEditWalkDogPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  if (!(await isAdmin())) redirect("/admin/login");
  const { id } = await params;
  const query = await searchParams;
  const today = londonToday();
  const requested = Array.isArray(query.day) ? query.day[0] : query.day;
  const day = clampWalkDay(requested ?? "", today);
  const book = await openBook();
  if (!book.ok) return null;
  const dog = (await book.store.listWalkPlan()).find((item) => item.id === id && item.active);
  if (!dog) notFound();

  return (
    <div className="mx-auto flex w-full max-w-lg flex-col gap-5">
      <Link href={`/admin/walks?day=${day}`} className="inline-flex h-11 items-center gap-1 text-base font-semibold">
        <ChevronLeft className="size-5" />
        Walks
      </Link>
      <div>
        <h1 className="font-heading text-3xl tracking-tight">{dog.dogName}</h1>
        <p className="mt-2 text-base text-muted-foreground">Change the days, or take this dog off the plan.</p>
      </div>
      <WalkPlanForm
        source="office"
        day={day}
        today={today}
        dogId={dog.id}
        dogName={dog.dogName}
        note={dog.note ?? ""}
        days={dog.days.map((item) => item.walkDate)}
      />
      <form action={removeWalkDog}>
        <input type="hidden" name="source" value="office" />
        <input type="hidden" name="day" value={day} />
        <input type="hidden" name="id" value={dog.id} />
        <Button type="submit" variant="outline" className="h-12 w-full rounded-2xl text-base text-destructive">
          Remove from the plan
        </Button>
      </form>
    </div>
  );
}

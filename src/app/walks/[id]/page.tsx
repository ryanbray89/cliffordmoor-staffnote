import { ChevronLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { removeWalkDog } from "@/lib/actions";
import { WalkPlanForm } from "@/components/walk-plan-form";
import { Shell } from "@/components/shell";
import { Button } from "@/components/ui/button";
import { openBook } from "@/lib/book";
import { getCurrentStaff } from "@/lib/session";
import { londonToday } from "@/lib/time";
import { clampWalkDay } from "@/lib/walks";

export const metadata: Metadata = { title: "Walk days" };

export default async function EditWalkDogPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const staff = await getCurrentStaff();
  if (!staff) redirect("/?needName=1");
  const { id } = await params;
  const query = await searchParams;
  const today = londonToday();
  const requested = Array.isArray(query.day) ? query.day[0] : query.day;
  const day = clampWalkDay(requested ?? "", today);
  const book = await openBook();
  const dog = book.ok ? (await book.store.listWalkPlan()).find((item) => item.id === id && item.active) : undefined;
  if (!book.ok) {
    return (
      <Shell>
        <p role="alert">{book.message}</p>
      </Shell>
    );
  }
  if (!dog) notFound();

  return (
    <Shell>
      <div className="mb-5">
        <Link href={`/walks?day=${day}`} className="inline-flex h-11 items-center gap-1 text-base font-semibold">
          <ChevronLeft className="size-5" />
          Extra walks
        </Link>
      </div>
      <h1 className="font-heading text-3xl tracking-tight">{dog.dogName}</h1>
      <p className="mt-2 mb-6 text-base text-muted-foreground">Change the days, or take this dog off the plan.</p>
      <WalkPlanForm
        source="yard"
        day={day}
        today={today}
        dogId={dog.id}
        dogName={dog.dogName}
        note={dog.note ?? ""}
        days={dog.days.map((item) => item.walkDate)}
      />
      <form action={removeWalkDog} className="mt-4">
        <input type="hidden" name="source" value="yard" />
        <input type="hidden" name="day" value={day} />
        <input type="hidden" name="id" value={dog.id} />
        <Button type="submit" variant="outline" className="h-12 w-full rounded-2xl text-base text-destructive">
          Remove from the plan
        </Button>
      </form>
    </Shell>
  );
}

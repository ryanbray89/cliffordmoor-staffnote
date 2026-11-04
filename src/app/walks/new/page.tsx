import { ChevronLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { WalkPlanForm } from "@/components/walk-plan-form";
import { Shell } from "@/components/shell";
import { getCurrentStaff } from "@/lib/session";
import { londonToday } from "@/lib/time";
import { clampWalkDay } from "@/lib/walks";

export const metadata: Metadata = { title: "Add a dog" };

export default async function NewWalkDogPage({
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

  return (
    <Shell>
      <div className="mb-5">
        <Link href={`/walks?day=${day}`} className="inline-flex h-11 items-center gap-1 text-base font-semibold">
          <ChevronLeft className="size-5" />
          Extra walks
        </Link>
      </div>
      <h1 className="font-heading text-3xl tracking-tight">Add a dog</h1>
      <p className="mt-2 mb-6 text-base text-muted-foreground">Each extra walk is 30 minutes.</p>
      <WalkPlanForm source="yard" day={day} today={today} />
    </Shell>
  );
}

import { ChevronLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { WalkPlanForm } from "@/components/walk-plan-form";
import { isAdmin } from "@/lib/session";
import { londonToday } from "@/lib/time";
import { clampWalkDay } from "@/lib/walks";

export const metadata: Metadata = { title: "Add a dog" };

export default async function OfficeNewWalkDogPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  if (!(await isAdmin())) redirect("/admin/login");
  const params = await searchParams;
  const today = londonToday();
  const requested = Array.isArray(params.day) ? params.day[0] : params.day;
  const day = clampWalkDay(requested ?? "", today);

  return (
    <div className="mx-auto flex w-full max-w-lg flex-col gap-5">
      <Link href={`/admin/walks?day=${day}`} className="inline-flex h-11 items-center gap-1 text-base font-semibold">
        <ChevronLeft className="size-5" />
        Walks
      </Link>
      <div>
        <h1 className="font-heading text-3xl tracking-tight">Add a dog</h1>
        <p className="mt-2 text-base text-muted-foreground">Each extra walk is 30 minutes.</p>
      </div>
      <WalkPlanForm source="office" day={day} today={today} />
    </div>
  );
}

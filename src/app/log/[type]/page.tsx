import { ChevronLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { clearStaff } from "@/lib/actions";
import { openBook } from "@/lib/book";
import { EMPTY_FILTERS } from "@/lib/filters";
import { staffJobStatus } from "@/lib/job-schedule";
import { getCurrentStaff } from "@/lib/session";
import { londonToday, shiftCivilDate } from "@/lib/time";
import { LogForm } from "@/components/log-form";
import { Shell } from "@/components/shell";

const COPY = {
  job: {
    title: "Extra job",
    hint: "Due jobs are marked. Pick every one that applies, or add your own.",
  },
  dog: {
    title: "Extra walk",
    hint: "Pick the dog and the days. Each walk is 30 minutes.",
  },
  note: {
    title: "Note for Ryan",
    hint: "Issues, maintenance, customer comments, anything the office should see.",
  },
} as const;

type LogKind = keyof typeof COPY;

function isKind(value: string): value is LogKind {
  return value === "job" || value === "dog" || value === "note";
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ type: string }>;
}): Promise<Metadata> {
  const { type } = await params;
  if (!isKind(type)) return { title: "Log" };
  return { title: COPY[type].title };
}

export default async function LogPage({ params }: { params: Promise<{ type: string }> }) {
  const { type } = await params;
  if (!isKind(type)) notFound();

  const staff = await getCurrentStaff();
  if (!staff) redirect("/?needName=1");

  const book = await openBook();
  const today = londonToday();
  const recent = book.ok ? await book.store.listEntries({ ...EMPTY_FILTERS, staffId: staff.id }, 40) : [];
  const jobStatus = book.ok && type === "job" ? staffJobStatus(await book.store.listJobLogs()) : undefined;
  const dogs: string[] = [];
  for (const entry of recent) {
    if (!entry.dogName) continue;
    if (dogs.some((dog) => dog.toLowerCase() === entry.dogName?.toLowerCase())) continue;
    dogs.push(entry.dogName);
    if (dogs.length === 8) break;
  }

  const copy = COPY[type];

  return (
    <Shell>
      <div className="mb-5 flex items-center justify-between gap-3">
        <Link href="/" className="inline-flex h-11 items-center gap-1 text-base font-semibold">
          <ChevronLeft className="size-5" />
          Staff Note
        </Link>
        <form action={clearStaff}>
          <button type="submit" className="h-11 text-sm font-semibold underline underline-offset-4">
            Not {staff.name}?
          </button>
        </form>
      </div>
      <h1 className="font-heading text-3xl tracking-tight">{copy.title}</h1>
      <p className="mt-2 mb-6 text-base text-muted-foreground">{copy.hint}</p>
      {!book.ok ? (
        <p role="alert" className="rounded-2xl bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {book.message}
        </p>
      ) : (
        <LogForm
          kind={type}
          today={today}
          minDate={shiftCivilDate(today, -14)}
          recentDogs={dogs}
          jobStatus={jobStatus}
        />
      )}
    </Shell>
  );
}

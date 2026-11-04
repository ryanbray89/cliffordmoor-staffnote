import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { markWalkDone, undoWalk } from "@/lib/actions";
import { WALK_FUTURE_DAYS, WALK_PAST_DAYS } from "@/lib/catalog";
import { formatLogged, formatLongDate, shiftCivilDate } from "@/lib/time";
import type { WalkOnDay } from "@/lib/walks";
import { Button } from "@/components/ui/button";

export function WalkChecklist({
  source,
  day,
  today,
  rows,
  todayLeft,
}: {
  source: "yard" | "office";
  day: string;
  today: string;
  rows: WalkOnDay[];
  todayLeft: number;
}) {
  const base = source === "office" ? "/admin/walks" : "/walks";
  const earliest = shiftCivilDate(today, -WALK_PAST_DAYS);
  const latest = shiftCivilDate(today, WALK_FUTURE_DAYS);
  const prev = shiftCivilDate(day, -1);
  const next = shiftCivilDate(day, 1);
  const walked = rows.filter((row) => row.day.doneAt).length;
  const label = day === today ? "Today" : day === shiftCivilDate(today, -1) ? "Yesterday" : formatLongDate(day);

  return (
    <div className="flex flex-col gap-5">
      {source === "office" ? (
        <p className="rounded-2xl bg-straw px-4 py-3 text-base font-semibold">
          {todayLeft === 0 ? "Everyone on today’s list has been walked." : `${todayLeft} still to walk today.`}
        </p>
      ) : null}
      <div className="flex items-center justify-between gap-2">
        {day > earliest ? (
          <Link href={`${base}?day=${prev}`} aria-label="Previous day" className="flex size-11 items-center justify-center rounded-full bg-card ring-1 ring-border">
            <ChevronLeft className="size-5" />
          </Link>
        ) : (
          <span className="size-11" />
        )}
        <div className="text-center">
          <p className="font-heading text-2xl">{label}</p>
          <p className="text-sm text-muted-foreground">
            {rows.length === 0 ? "No walks" : `${walked} of ${rows.length} walked`}
          </p>
        </div>
        {day < latest ? (
          <Link href={`${base}?day=${next}`} aria-label="Next day" className="flex size-11 items-center justify-center rounded-full bg-card ring-1 ring-border">
            <ChevronRight className="size-5" />
          </Link>
        ) : (
          <span className="size-11" />
        )}
      </div>

      {rows.length === 0 ? (
        <p className="rounded-2xl bg-card px-5 py-8 text-center text-base text-muted-foreground ring-1 ring-border">
          No extra walks on this day.
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {rows.map(({ dog, day: walk }) => (
            <li key={walk.id} className="rounded-2xl bg-card px-4 py-4 shadow-sm ring-1 ring-border">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold">{dog.dogName}</h2>
                  {dog.note ? <p className="text-sm text-muted-foreground">{dog.note}</p> : null}
                </div>
                {dog.active ? (
                  <Link href={`${base}/${dog.id}?day=${day}`} className="shrink-0 text-sm font-semibold underline underline-offset-4">
                    Days
                  </Link>
                ) : null}
              </div>
              {walk.doneAt && walk.doneByName ? (
                <div className="mt-3 flex flex-col gap-2">
                  <p className="text-sm font-medium">
                    Walked by {walk.doneByName} · {formatLogged(walk.doneAt)}
                  </p>
                  <form action={undoWalk}>
                    <input type="hidden" name="source" value={source} />
                    <input type="hidden" name="id" value={walk.id} />
                    <Button type="submit" variant="outline" className="h-12 w-full rounded-2xl bg-card text-base">
                      Undo
                    </Button>
                  </form>
                </div>
              ) : (
                <form action={markWalkDone} className="mt-3">
                  <input type="hidden" name="source" value={source} />
                  <input type="hidden" name="id" value={walk.id} />
                  <Button type="submit" className="h-12 w-full rounded-2xl text-base">
                    Walked
                  </Button>
                </form>
              )}
            </li>
          ))}
        </ul>
      )}

      <Link
        href={`${base}/new?day=${day}`}
        className="flex h-14 items-center justify-center rounded-2xl bg-primary text-base font-semibold text-primary-foreground"
      >
        + Add dog
      </Link>
    </div>
  );
}

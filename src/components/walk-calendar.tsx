"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { MAX_WALK_DAYS, WALK_FUTURE_DAYS, WALK_MINUTES, WALK_PAST_DAYS } from "@/lib/catalog";
import { formatLongDate, formatShortDate, shiftCivilDate } from "@/lib/time";
import { cn } from "@/lib/utils";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

function shiftMonth(monthKey: string, delta: number): string {
  const [year, month] = monthKey.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1 + delta, 1));
  const nextYear = date.getUTCFullYear();
  const nextMonth = String(date.getUTCMonth() + 1).padStart(2, "0");
  return `${nextYear}-${nextMonth}`;
}

function formatMonth(monthKey: string): string {
  const [year, month] = monthKey.split("-").map(Number);
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "UTC",
    month: "long",
    year: "numeric",
  }).format(new Date(Date.UTC(year, month - 1, 1, 12)));
}

function daysInMonth(monthKey: string): number {
  const [year, month] = monthKey.split("-").map(Number);
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

function mondayOffset(monthKey: string): number {
  const [year, month] = monthKey.split("-").map(Number);
  const weekday = new Date(Date.UTC(year, month - 1, 1)).getUTCDay();
  return (weekday + 6) % 7;
}

export function WalkCalendar({ today }: { today: string }) {
  const earliest = shiftCivilDate(today, -WALK_PAST_DAYS);
  const latest = shiftCivilDate(today, WALK_FUTURE_DAYS);
  const minMonth = earliest.slice(0, 7);
  const maxMonth = latest.slice(0, 7);
  const [month, setMonth] = useState(() => today.slice(0, 7));
  const [selection, setSelection] = useState<{ days: string[]; note: string }>({ days: [], note: "" });

  function toggle(iso: string) {
    setSelection((current) => {
      if (current.days.includes(iso)) {
        return { days: current.days.filter((day) => day !== iso), note: "" };
      }
      if (current.days.length >= MAX_WALK_DAYS) {
        return { ...current, note: "You can pick up to 20 days." };
      }
      return { days: [...current.days, iso].sort(), note: "" };
    });
  }

  const offset = mondayOffset(month);
  const count = daysInMonth(month);
  const cells: Array<string | null> = [
    ...Array.from({ length: offset }, () => null),
    ...Array.from({ length: count }, (_, index) => {
      const day = String(index + 1).padStart(2, "0");
      return `${month}-${day}`;
    }),
  ];
  const selected = selection.days;
  const dayWord = selected.length === 1 ? "day" : "days";

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          aria-label="Previous month"
          disabled={month <= minMonth}
          onClick={() => setMonth((current) => shiftMonth(current, -1))}
          className="flex size-11 items-center justify-center rounded-full bg-card ring-1 ring-border disabled:opacity-40"
        >
          <ChevronLeft className="size-5" />
        </button>
        <p className="font-heading text-xl">{formatMonth(month)}</p>
        <button
          type="button"
          aria-label="Next month"
          disabled={month >= maxMonth}
          onClick={() => setMonth((current) => shiftMonth(current, 1))}
          className="flex size-11 items-center justify-center rounded-full bg-card ring-1 ring-border disabled:opacity-40"
        >
          <ChevronRight className="size-5" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1" role="group" aria-label="Days to walk">
        {WEEKDAYS.map((weekday) => (
          <div key={weekday} className="flex h-8 items-center justify-center text-xs font-semibold text-muted-foreground">
            {weekday}
          </div>
        ))}
        {cells.map((iso, index) => {
          if (!iso) return <div key={`blank-${index}`} />;
          const inRange = iso >= earliest && iso <= latest;
          const pressed = selected.includes(iso);
          const dayNumber = Number(iso.slice(8));
          return (
            <button
              key={iso}
              type="button"
              disabled={!inRange}
              aria-pressed={pressed}
              aria-label={`${formatLongDate(iso)}${iso === today ? ", today" : ""}`}
              onClick={() => toggle(iso)}
              className={cn(
                "flex h-11 items-center justify-center rounded-xl text-base font-semibold tabular-nums",
                pressed && "bg-primary text-primary-foreground",
                !pressed && inRange && "bg-card ring-1 ring-border",
                !pressed && iso === today && "ring-2 ring-primary",
                !inRange && "text-muted-foreground/40",
              )}
            >
              {dayNumber}
            </button>
          );
        })}
      </div>

      {selected.map((iso) => (
        <input key={iso} type="hidden" name="walkDate" value={iso} />
      ))}

      <p aria-live="polite" className="text-sm text-muted-foreground">
        {selected.length === 0
          ? `No days selected. Each walk is ${WALK_MINUTES} minutes.`
          : `${selected.length} ${dayWord}, ${WALK_MINUTES} minutes each.`}
      </p>
      {selection.note ? (
        <p role="alert" className="text-sm font-medium text-destructive">
          {selection.note}
        </p>
      ) : null}

      {selected.length > 0 ? (
        <ul className="flex flex-wrap gap-2" aria-label="Selected walk days">
          {selected.map((iso) => (
            <li key={iso}>
              <button
                type="button"
                onClick={() => toggle(iso)}
                className="inline-flex h-11 items-center gap-2 rounded-full bg-accent px-3 text-sm font-semibold text-accent-foreground"
              >
                {formatShortDate(iso)}
                <span aria-hidden="true">×</span>
                <span className="sr-only">Remove {formatLongDate(iso)}</span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

"use client";

import { useActionState } from "react";

import { saveWalkDog } from "@/lib/actions";
import { WalkCalendar } from "@/components/walk-calendar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const fieldClass = "h-14 rounded-2xl bg-card px-4 text-lg md:text-lg";

export function WalkPlanForm({
  source,
  day,
  today,
  dogId,
  dogName = "",
  note = "",
  days = [],
}: {
  source: "yard" | "office";
  day: string;
  today: string;
  dogId?: string;
  dogName?: string;
  note?: string;
  days?: string[];
}) {
  const [state, action, pending] = useActionState(saveWalkDog, {});

  return (
    <form action={action} className="flex flex-col gap-6">
      <input type="hidden" name="source" value={source} />
      <input type="hidden" name="day" value={day} />
      {dogId ? <input type="hidden" name="id" value={dogId} /> : null}
      <div className="flex flex-col gap-2">
        <Label htmlFor="dogName" className="text-base">
          Dog&apos;s name
        </Label>
        <Input
          id="dogName"
          name="dogName"
          defaultValue={dogName}
          maxLength={60}
          required
          autoComplete="off"
          autoCapitalize="words"
          placeholder="Bramble"
          className={fieldClass}
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="note" className="text-base">
          Kennel or owner
        </Label>
        <Input
          id="note"
          name="note"
          defaultValue={note}
          maxLength={120}
          autoComplete="off"
          placeholder="Kennel 12, Hale"
          className={fieldClass}
        />
        <p className="text-sm text-muted-foreground">Optional.</p>
      </div>
      <div className="flex flex-col gap-2">
        <p className="text-base font-medium">Which days?</p>
        <p className="text-sm text-muted-foreground">Each walk is 30 minutes. Tap a day to add or remove it.</p>
        <WalkCalendar today={today} initialDays={days} />
      </div>
      {state.error ? (
        <p role="alert" className="rounded-2xl bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive">
          {state.error}
        </p>
      ) : null}
      <Button type="submit" disabled={pending} className="h-14 w-full rounded-2xl text-base font-semibold">
        {pending ? "Saving…" : dogId ? "Save days" : "Add to the plan"}
      </Button>
    </form>
  );
}

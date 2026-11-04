"use client";

import { useActionState, useState } from "react";

import { unlockOffice } from "@/lib/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const keys = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "delete"] as const;

export function OfficeLock() {
  const [pin, setPin] = useState("");
  const [state, action, pending] = useActionState(unlockOffice, {});

  return (
    <form action={action} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="pin" className="text-base">
          PIN or password
        </Label>
        <Input
          id="pin"
          name="pin"
          type="password"
          autoComplete="current-password"
          value={pin}
          onChange={(event) => setPin(event.target.value.slice(0, 64))}
          className="h-14 rounded-2xl bg-card text-center text-2xl tracking-[0.35em] md:text-2xl"
        />
      </div>
      <div className="grid grid-cols-3 gap-2">
        {keys.map((key) => {
          if (key === "") return <span key="spacer" />;
          if (key === "delete") {
            return (
              <Button
                key={key}
                type="button"
                variant="outline"
                className="h-16 rounded-2xl text-base"
                onClick={() => setPin((value) => value.slice(0, -1))}
              >
                Delete
              </Button>
            );
          }
          return (
            <Button
              key={key}
              type="button"
              variant="outline"
              className="h-16 rounded-2xl text-2xl"
              onClick={() => setPin((value) => `${value}${key}`.slice(0, 64))}
            >
              {key}
            </Button>
          );
        })}
      </div>
      {state.error ? (
        <p role="alert" className="rounded-2xl bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive">
          {state.error}
        </p>
      ) : null}
      <Button type="submit" disabled={pending || pin.length === 0} className="h-14 rounded-2xl text-base font-semibold">
        {pending ? "Checking…" : "Unlock office"}
      </Button>
    </form>
  );
}

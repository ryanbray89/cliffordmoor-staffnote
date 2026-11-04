"use client";

import { useActionState, useState } from "react";

import { addShoppingItem } from "@/lib/actions";
import { sameItemName } from "@/lib/shopping";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const fieldClass = "h-14 rounded-2xl bg-card px-4 text-lg md:text-lg";

export function ShoppingForm({ openNames }: { openNames: string[] }) {
  const [state, action, pending] = useActionState(addShoppingItem, {});
  const [item, setItem] = useState("");
  const match = openNames.find((name) => sameItemName(name, item));

  return (
    <form action={action} className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <Label htmlFor="item" className="text-base">
          What do we need?
        </Label>
        <Input
          id="item"
          name="item"
          value={item}
          onChange={(event) => setItem(event.target.value)}
          maxLength={80}
          required
          autoComplete="off"
          placeholder="Poop bags"
          className={fieldClass}
        />
        {match ? (
          <p className="rounded-2xl bg-straw px-4 py-3 text-sm font-medium">
            {match} is already on the list. Add it again only if you need more.
          </p>
        ) : (
          <p className="text-sm text-muted-foreground">Check the list above before you add it.</p>
        )}
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="quantity" className="text-base">
          How many?
        </Label>
        <Input
          id="quantity"
          name="quantity"
          maxLength={40}
          autoComplete="off"
          placeholder="2 boxes"
          className={fieldClass}
        />
        <p className="text-sm text-muted-foreground">Optional.</p>
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="note" className="text-base">
          Note
        </Label>
        <Textarea
          id="note"
          name="note"
          maxLength={500}
          placeholder="Which kind, or where it lives"
          className="min-h-24 rounded-2xl bg-card px-4 py-3 text-lg md:text-lg"
        />
        <p className="text-sm text-muted-foreground">Optional.</p>
      </div>
      {state.error ? (
        <p role="alert" className="rounded-2xl bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive">
          {state.error}
        </p>
      ) : null}
      <Button type="submit" disabled={pending} className="h-14 w-full rounded-2xl text-base font-semibold">
        {pending ? "Adding…" : "Add to the list"}
      </Button>
    </form>
  );
}

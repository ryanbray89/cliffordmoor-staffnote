"use client";

import { useState } from "react";

import { adjustStock, deleteStockItem, renameStockItem, setStockKennels, setStockStatus } from "@/lib/actions";
import { formatStockQuantity, type StockItem, type StockStatus } from "@/lib/stock";
import { formatLogged } from "@/lib/time";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const STATUS_LABEL: Record<StockStatus, string> = { ok: "OK", low: "Low", out: "Out" };

function tileClass(status: StockStatus): string {
  if (status === "out") return "bg-red-50 ring-red-600";
  if (status === "low") return "bg-amber-50 ring-amber-500";
  return "bg-emerald-50 ring-emerald-600";
}

function badgeClass(status: StockStatus): string {
  if (status === "out") return "bg-red-600 text-white";
  if (status === "low") return "bg-amber-500 text-amber-950";
  return "bg-emerald-600 text-white";
}

export function StockTile({ item, source }: { item: StockItem; source: "yard" | "office" }) {
  const [open, setOpen] = useState(false);

  return (
    <article className={cn("flex flex-col rounded-2xl p-3 shadow-sm ring-2", tileClass(item.status), open && "col-span-2 sm:col-span-3 lg:col-span-4")}>
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
        className="flex flex-col gap-1 text-left"
      >
        <span className="flex items-start justify-between gap-2">
          <span className="line-clamp-3 text-sm font-semibold leading-tight">{item.name}</span>
          <span className={cn("shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold", badgeClass(item.status))}>
            {STATUS_LABEL[item.status]}
          </span>
        </span>
        <span className="text-3xl font-semibold tabular-nums leading-none">{formatStockQuantity(item.quantity)}</span>
        <span className="text-xs text-muted-foreground">
          {item.kennelsNote ? `At kennels: ${item.kennelsNote}` : "At kennels: —"}
        </span>
      </button>
      {open ? (
        <div className="mt-3 flex flex-col gap-3 border-t border-black/10 pt-3">
          <div className="flex items-center gap-2">
            <form action={adjustStock}>
              <input type="hidden" name="source" value={source} />
              <input type="hidden" name="id" value={item.id} />
              <input type="hidden" name="delta" value="-0.5" />
              <Button type="submit" variant="outline" className="size-12 rounded-2xl bg-card text-2xl" aria-label={`Less ${item.name}`}>
                −
              </Button>
            </form>
            <p className="min-w-14 text-center text-2xl font-semibold tabular-nums">{formatStockQuantity(item.quantity)}</p>
            <form action={adjustStock}>
              <input type="hidden" name="source" value={source} />
              <input type="hidden" name="id" value={item.id} />
              <input type="hidden" name="delta" value="0.5" />
              <Button type="submit" variant="outline" className="size-12 rounded-2xl bg-card text-2xl" aria-label={`More ${item.name}`}>
                +
              </Button>
            </form>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {(["ok", "low", "out"] as const).map((status) => (
              <form key={status} action={setStockStatus}>
                <input type="hidden" name="source" value={source} />
                <input type="hidden" name="id" value={item.id} />
                <input type="hidden" name="status" value={status} />
                <button
                  type="submit"
                  aria-pressed={item.status === status}
                  className={cn(
                    "h-11 w-full rounded-xl text-sm font-semibold",
                    item.status === status ? badgeClass(status) : "bg-card text-foreground ring-1 ring-border",
                  )}
                >
                  {STATUS_LABEL[status]}
                </button>
              </form>
            ))}
          </div>
          <form action={setStockKennels} className="flex items-end gap-2">
            <input type="hidden" name="source" value={source} />
            <input type="hidden" name="id" value={item.id} />
            <label className="flex min-w-0 flex-1 flex-col gap-1 text-xs font-medium">
              At kennels
              <Input
                name="kennels"
                defaultValue={item.kennelsNote ?? ""}
                maxLength={80}
                placeholder="Optional"
                className="h-11 rounded-xl bg-card px-3 text-base md:text-base"
              />
            </label>
            <Button type="submit" variant="outline" className="h-11 rounded-xl bg-card px-3">
              Save
            </Button>
          </form>
          <p className="text-xs text-muted-foreground">
            Updated by {item.updatedByName}, {formatLogged(item.updatedAt)}
          </p>
          {source === "office" ? (
            <details className="rounded-xl bg-card/80 px-3 py-2">
              <summary className="cursor-pointer text-sm font-semibold">Rename or remove</summary>
              <form action={renameStockItem} className="mt-3 flex flex-col gap-2">
                <input type="hidden" name="id" value={item.id} />
                <Input name="name" defaultValue={item.name} maxLength={80} required className="h-11 rounded-xl bg-card px-3 text-base md:text-base" />
                <Button type="submit" variant="outline" className="h-11 rounded-xl bg-card">
                  Rename
                </Button>
              </form>
              <form action={deleteStockItem} className="mt-2">
                <input type="hidden" name="id" value={item.id} />
                <Button type="submit" variant="outline" className="h-11 w-full rounded-xl text-destructive">
                  Delete
                </Button>
              </form>
            </details>
          ) : null}
        </div>
      ) : null}
    </article>
  );
}

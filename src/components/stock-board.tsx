import { adjustStock, addStockItem, deleteStockItem, renameStockItem, setStockKennels, setStockStatus } from "@/lib/actions";
import { formatStockQuantity, type StockItem, type StockStatus } from "@/lib/stock";
import { formatLogged } from "@/lib/time";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const STATUS_LABEL: Record<StockStatus, string> = { ok: "OK", low: "Low", out: "Out" };

function badgeClass(status: StockStatus, pressed: boolean): string {
  if (!pressed) return "bg-card text-foreground ring-1 ring-border";
  if (status === "out") return "bg-destructive text-white ring-1 ring-destructive";
  if (status === "low") return "bg-destructive/15 text-destructive ring-1 ring-destructive";
  return "bg-accent text-accent-foreground ring-1 ring-accent";
}

export function StockBoard({
  source,
  items,
}: {
  source: "yard" | "office";
  items: StockItem[];
}) {
  const out = items.filter((item) => item.status === "out").length;
  const low = items.filter((item) => item.status === "low").length;

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-muted-foreground">
        {items.length === 0
          ? "Nothing on the stock list yet."
          : `${out} out, ${low} low. This does not add anything to the shopping list.`}
      </p>
      {items.map((item) => (
        <article
          key={item.id}
          className={cn(
            "flex flex-col gap-3 rounded-2xl bg-card px-4 py-4 shadow-sm ring-1",
            item.status === "out" ? "ring-destructive" : "ring-border",
          )}
        >
          <div className="flex items-start justify-between gap-3">
            <h2 className="font-heading text-xl leading-snug">{item.name}</h2>
            <span className={cn("shrink-0 rounded-full px-2.5 py-1 text-sm font-semibold", badgeClass(item.status, true))}>
              {STATUS_LABEL[item.status]}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <form action={adjustStock}>
              <input type="hidden" name="source" value={source} />
              <input type="hidden" name="id" value={item.id} />
              <input type="hidden" name="delta" value="-0.5" />
              <Button type="submit" variant="outline" className="size-14 rounded-2xl bg-card text-2xl" aria-label={`Less ${item.name}`}>
                −
              </Button>
            </form>
            <p className="min-w-16 text-center text-2xl font-semibold tabular-nums">{formatStockQuantity(item.quantity)}</p>
            <form action={adjustStock}>
              <input type="hidden" name="source" value={source} />
              <input type="hidden" name="id" value={item.id} />
              <input type="hidden" name="delta" value="0.5" />
              <Button type="submit" variant="outline" className="size-14 rounded-2xl bg-card text-2xl" aria-label={`More ${item.name}`}>
                +
              </Button>
            </form>
            <p className="text-sm text-muted-foreground">in store</p>
          </div>
          <form action={setStockKennels} className="flex items-end gap-2">
            <input type="hidden" name="source" value={source} />
            <input type="hidden" name="id" value={item.id} />
            <label className="flex min-w-0 flex-1 flex-col gap-1 text-sm font-medium">
              At kennels
              <Input
                name="kennels"
                defaultValue={item.kennelsNote ?? ""}
                maxLength={80}
                placeholder="Optional"
                className="h-12 rounded-2xl bg-card px-3 text-base md:text-base"
              />
            </label>
            <Button type="submit" variant="outline" className="h-12 rounded-2xl bg-card px-4">
              Save
            </Button>
          </form>
          <div className="grid grid-cols-3 gap-2">
            {(["ok", "low", "out"] as const).map((status) => (
              <form key={status} action={setStockStatus}>
                <input type="hidden" name="source" value={source} />
                <input type="hidden" name="id" value={item.id} />
                <input type="hidden" name="status" value={status} />
                <button
                  type="submit"
                  aria-pressed={item.status === status}
                  className={cn("h-12 w-full rounded-xl text-base font-semibold", badgeClass(status, item.status === status))}
                >
                  {STATUS_LABEL[status]}
                </button>
              </form>
            ))}
          </div>
          <p className="text-sm text-muted-foreground">
            Updated by {item.updatedByName}, {formatLogged(item.updatedAt)}
          </p>
          {source === "office" ? (
            <details className="rounded-2xl bg-secondary/60 px-3 py-3">
              <summary className="cursor-pointer text-sm font-semibold">Rename or remove</summary>
              <form action={renameStockItem} className="mt-3 flex flex-col gap-2">
                <input type="hidden" name="id" value={item.id} />
                <Input name="name" defaultValue={item.name} maxLength={80} required className="h-12 rounded-2xl bg-card px-3 text-base md:text-base" />
                <Button type="submit" variant="outline" className="h-12 rounded-2xl bg-card">
                  Rename
                </Button>
              </form>
              <form action={deleteStockItem} className="mt-2">
                <input type="hidden" name="id" value={item.id} />
                <Button type="submit" variant="outline" className="h-12 w-full rounded-2xl text-destructive">
                  Delete
                </Button>
              </form>
            </details>
          ) : null}
        </article>
      ))}
      <form action={addStockItem} className="flex flex-col gap-3 rounded-2xl bg-card px-4 py-4 ring-1 ring-border">
        <input type="hidden" name="source" value={source} />
        <h2 className="font-heading text-xl">Add an item</h2>
        <Input name="name" maxLength={80} required placeholder="What is it?" className="h-14 rounded-2xl bg-card px-4 text-lg md:text-lg" />
        <Input
          name="quantity"
          inputMode="decimal"
          defaultValue="0"
          placeholder="Quantity in store"
          className="h-14 rounded-2xl bg-card px-4 text-lg md:text-lg"
        />
        <Button type="submit" className="h-14 rounded-2xl text-base">
          Add to stock
        </Button>
      </form>
    </div>
  );
}

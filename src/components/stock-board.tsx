import { addStockItem } from "@/lib/actions";
import type { StockItem } from "@/lib/stock";
import { StockTile } from "@/components/stock-tile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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
          : `${out} out, ${low} low. Tap a tile to change it. This does not add anything to the shopping list.`}
      </p>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
        {items.map((item) => (
          <StockTile key={item.id} item={item} source={source} />
        ))}
      </div>
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

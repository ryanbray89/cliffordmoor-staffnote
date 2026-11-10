import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { StockBoard } from "@/components/stock-board";
import { openBook } from "@/lib/book";
import { isAdmin } from "@/lib/session";

export const metadata: Metadata = { title: "Stock" };

export default async function OfficeStockPage() {
  if (!(await isAdmin())) redirect("/admin/login");
  const book = await openBook();
  if (!book.ok) return null;
  const items = await book.store.listStock();

  return (
    <div className="flex w-full flex-col gap-5">
      <div>
        <h1 className="font-heading text-3xl tracking-tight">Stock</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          In the store, and anything still at the kennels. Changing stock does not add a shopping item.
        </p>
      </div>
      <StockBoard source="office" items={items} />
    </div>
  );
}

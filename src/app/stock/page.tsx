import { ChevronLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { StockBoard } from "@/components/stock-board";
import { Shell } from "@/components/shell";
import { openBook } from "@/lib/book";
import { getCurrentStaff } from "@/lib/session";

export const metadata: Metadata = { title: "Stock" };

export default async function StockPage() {
  const staff = await getCurrentStaff();
  if (!staff) redirect("/?needName=1");
  const book = await openBook();

  return (
    <Shell wide>
      <div className="mb-5">
        <Link href="/" className="inline-flex h-11 items-center gap-1 text-base font-semibold">
          <ChevronLeft className="size-5" />
          Staff Note
        </Link>
      </div>
      <h1 className="font-heading text-3xl tracking-tight">Stock</h1>
      <p className="mt-2 mb-6 text-base text-muted-foreground">
        What is in the store. Out and low sit at the top. Halves are allowed, such as 0.5.
      </p>
      {!book.ok ? (
        <p role="alert" className="rounded-2xl bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {book.message}
        </p>
      ) : (
        <StockBoard source="yard" items={await book.store.listStock()} />
      )}
    </Shell>
  );
}

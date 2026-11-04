import { ChevronLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { markShoppingGot } from "@/lib/actions";
import { openBook } from "@/lib/book";
import { getCurrentStaff } from "@/lib/session";
import { formatLogged } from "@/lib/time";
import { ShoppingForm } from "@/components/shopping-form";
import { Shell } from "@/components/shell";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Shopping list" };

export default async function ShoppingPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const staff = await getCurrentStaff();
  if (!staff) redirect("/?needName=1");

  const params = await searchParams;
  const saved = params.saved === "1" || (Array.isArray(params.saved) && params.saved[0] === "1");
  const book = await openBook();
  const items = book.ok ? await book.store.listShopping() : [];
  const open = items.filter((item) => item.status === "needed");

  return (
    <Shell>
      <div className="mb-5 flex items-center justify-between gap-3">
        <Link href="/" className="inline-flex h-11 items-center gap-1 text-base font-semibold">
          <ChevronLeft className="size-5" />
          Staff Note
        </Link>
      </div>
      <h1 className="font-heading text-3xl tracking-tight">Shopping list</h1>
      <p className="mt-2 mb-6 text-base text-muted-foreground">
        Add something the yard needs. Have a look at what is already on the list.
      </p>
      {!book.ok ? (
        <p role="alert" className="rounded-2xl bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {book.message}
        </p>
      ) : (
        <div className="flex flex-col gap-8">
          {saved ? (
            <p role="status" className="rounded-2xl bg-accent px-4 py-3 text-base font-medium text-accent-foreground">
              Added to the shopping list.
            </p>
          ) : null}
          <section className="flex flex-col gap-3" aria-label="Still to buy">
            <h2 className="font-heading text-2xl">Still to buy</h2>
            {open.length === 0 ? (
              <p className="text-base text-muted-foreground">Nothing on the list.</p>
            ) : (
              open.map((item) => (
                <article key={item.id} className="rounded-2xl bg-card px-4 py-4 shadow-sm ring-1 ring-border">
                  <h3 className="text-lg font-semibold">{item.item}</h3>
                  {item.quantity ? <p className="text-sm text-muted-foreground">{item.quantity}</p> : null}
                  {item.note ? <p className="mt-1 whitespace-pre-wrap text-base">{item.note}</p> : null}
                  <p className="mt-2 text-sm text-muted-foreground">
                    {item.addedByName} · {formatLogged(item.createdAt)}
                  </p>
                  <form action={markShoppingGot} className="mt-3">
                    <input type="hidden" name="id" value={item.id} />
                    <Button type="submit" variant="outline" className="h-12 w-full rounded-2xl bg-card text-base">
                      Got it
                    </Button>
                  </form>
                </article>
              ))
            )}
          </section>
          <ShoppingForm openNames={open.map((item) => item.item)} />
        </div>
      )}
    </Shell>
  );
}

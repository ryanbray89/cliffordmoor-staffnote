import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { deleteShoppingItem, markShoppingBought } from "@/lib/actions";
import { openBook } from "@/lib/book";
import { amazonSearchUrl } from "@/lib/shopping";
import { isAdmin } from "@/lib/session";
import { formatLogged } from "@/lib/time";
import { Button, buttonVariants } from "@/components/ui/button";

export const metadata: Metadata = { title: "Shopping" };

export default async function OfficeShoppingPage() {
  if (!(await isAdmin())) redirect("/admin/login");
  const book = await openBook();
  if (!book.ok) return null;

  const items = await book.store.listShopping();
  const open = items.filter((item) => item.status === "needed");
  const bought = items
    .filter((item) => item.status === "bought")
    .sort((a, b) => (b.boughtAt ?? b.createdAt).localeCompare(a.boughtAt ?? a.createdAt))
    .slice(0, 40);

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="font-heading text-3xl tracking-tight">Shopping</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {open.length === 0 ? "Nothing to buy." : `${open.length} still to buy.`}
        </p>
      </div>

      {open.length === 0 ? (
        <p className="rounded-2xl bg-card px-5 py-8 text-center text-base text-muted-foreground ring-1 ring-border">
          The shopping list is clear.
        </p>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {open.map((item) => (
            <article key={item.id} className="flex flex-col gap-3 rounded-2xl bg-card px-4 py-4 shadow-sm ring-1 ring-border">
              <div>
                <h2 className="font-heading text-2xl">{item.item}</h2>
                {item.quantity ? <p className="text-sm text-muted-foreground">{item.quantity}</p> : null}
                {item.note ? <p className="mt-2 whitespace-pre-wrap text-base">{item.note}</p> : null}
                <p className="mt-2 text-sm text-muted-foreground">
                  {item.addedByName} · {formatLogged(item.createdAt)}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <form action={markShoppingBought}>
                  <input type="hidden" name="id" value={item.id} />
                  <Button type="submit" className="h-12 w-full rounded-xl text-base">
                    Bought
                  </Button>
                </form>
                <form action={deleteShoppingItem}>
                  <input type="hidden" name="id" value={item.id} />
                  <Button type="submit" variant="outline" className="h-12 w-full rounded-xl text-base">
                    Delete
                  </Button>
                </form>
              </div>
              <a
                href={amazonSearchUrl(item.item, item.quantity)}
                target="_blank"
                rel="noopener noreferrer"
                className={buttonVariants({ variant: "outline", className: "h-12 w-full rounded-xl text-base" })}
              >
                Amazon
              </a>
            </article>
          ))}
        </div>
      )}

      <details className="rounded-2xl bg-card p-4 ring-1 ring-border">
        <summary className="cursor-pointer text-base font-semibold">Recently bought</summary>
        {bought.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">Nothing marked bought yet.</p>
        ) : (
          <ul className="mt-4 flex flex-col gap-3">
            {bought.map((item) => (
              <li key={item.id} className="border-t border-border pt-3 first:border-t-0 first:pt-0">
                <p className="text-base font-semibold">{item.item}</p>
                {item.quantity ? <p className="text-sm text-muted-foreground">{item.quantity}</p> : null}
                <p className="text-sm text-muted-foreground">
                  Bought by {item.boughtByName ?? "the office"}
                  {item.boughtAt ? ` · ${formatLogged(item.boughtAt)}` : ""}
                </p>
              </li>
            ))}
          </ul>
        )}
      </details>
    </div>
  );
}

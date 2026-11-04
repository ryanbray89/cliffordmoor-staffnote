import { redirect } from "next/navigation";

import { BrandLockup } from "@/components/brand";
import { OfficeNav } from "@/components/office-nav";
import { Shell } from "@/components/shell";
import { StorageBanner } from "@/components/storage-banner";
import { openBook } from "@/lib/book";
import { isAdmin, usingStarterPin } from "@/lib/session";

export default async function OfficeLayout({ children }: { children: React.ReactNode }) {
  if (!(await isAdmin())) redirect("/admin/login");
  const book = await openBook();

  return (
    <Shell wide home="office">
      <div className="mb-6 flex flex-col gap-4">
        <BrandLockup title="Office book" href="/admin" />
        {book.ok ? <OfficeNav newCount={await book.store.countNew()} /> : null}
        {usingStarterPin() ? (
          <p role="status" className="rounded-2xl bg-straw px-4 py-3 text-sm">
            The office is still using the starter PIN 2468. Change ADMIN_PIN before the yard relies on this.
          </p>
        ) : null}
        {book.ok ? <StorageBanner mode={book.mode} /> : <p role="alert">{book.message}</p>}
      </div>
      {book.ok ? children : null}
    </Shell>
  );
}

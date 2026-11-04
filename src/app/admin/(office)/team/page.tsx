import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { addStaffMember, moveStaffMember, renameStaffMember, setStaffActive } from "@/lib/actions";
import { openBook } from "@/lib/book";
import { one } from "@/lib/filters";
import { isAdmin } from "@/lib/session";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const metadata: Metadata = { title: "Team" };

const ERRORS: Record<string, string> = {
  empty: "Type a name.",
  duplicate: "That name is already on the list.",
  missing: "That person is not on the list.",
};

export default async function TeamPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  if (!(await isAdmin())) redirect("/admin/login");
  const params = await searchParams;
  const book = await openBook();
  if (!book.ok) return null;
  const staff = await book.store.listStaff({ includeInactive: true });
  const error = ERRORS[one(params.error)] ?? "";

  return (
    <div className="flex max-w-xl flex-col gap-5">
      <div>
        <h1 className="font-heading text-3xl tracking-tight">Team</h1>
        <p className="mt-2 text-base text-muted-foreground">
          These names appear on the yard screen. Hiding someone keeps their old logs, but they drop off the list.
        </p>
      </div>
      {error ? (
        <p role="alert" className="rounded-2xl bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive">
          {error}
        </p>
      ) : null}
      <form key={staff.length} action={addStaffMember} className="flex flex-col gap-2 sm:flex-row">
        <Input
          name="name"
          placeholder="Add a name"
          maxLength={40}
          autoComplete="off"
          aria-label="New name"
          className="h-14 flex-1 rounded-2xl bg-card px-4 text-lg md:text-lg"
        />
        <Button type="submit" className="h-14 rounded-2xl px-6 text-base">
          Add
        </Button>
      </form>
      {staff.length === 0 ? (
        <p className="text-base text-muted-foreground">Add your team before the yard can log anything.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {staff.map((person, index) => (
            <li
              key={`${person.id}-${person.name}-${person.active}-${person.sortOrder}`}
              className="rounded-2xl bg-card p-4 ring-1 ring-border"
            >
              <form action={renameStaffMember} className="flex flex-col gap-2 sm:flex-row">
                <input type="hidden" name="id" value={person.id} />
                <Input
                  name="name"
                  defaultValue={person.name}
                  maxLength={40}
                  aria-label={`Name for ${person.name}`}
                  className="h-12 flex-1 rounded-2xl bg-background px-3 text-base md:text-base"
                />
                <Button type="submit" variant="outline" className="h-12 rounded-2xl px-4">
                  Save name
                </Button>
              </form>
              <div className="mt-3 flex flex-wrap gap-2">
                <form action={setStaffActive}>
                  <input type="hidden" name="id" value={person.id} />
                  <input type="hidden" name="active" value={person.active ? "no" : "yes"} />
                  <Button type="submit" variant="outline" className="h-11 rounded-full px-4">
                    {person.active ? "Hide from yard" : "Show on yard"}
                  </Button>
                </form>
                <form action={moveStaffMember}>
                  <input type="hidden" name="id" value={person.id} />
                  <input type="hidden" name="direction" value="up" />
                  <Button type="submit" variant="ghost" className="h-11 rounded-full px-4" disabled={index === 0}>
                    Up
                  </Button>
                </form>
                <form action={moveStaffMember}>
                  <input type="hidden" name="id" value={person.id} />
                  <input type="hidden" name="direction" value="down" />
                  <Button type="submit" variant="ghost" className="h-11 rounded-full px-4" disabled={index === staff.length - 1}>
                    Down
                  </Button>
                </form>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

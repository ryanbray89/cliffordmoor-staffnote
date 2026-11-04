import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { openBook } from "@/lib/book";
import { JOB_GROUPS } from "@/lib/catalog";
import { jobBoard, type JobStatus } from "@/lib/job-schedule";
import { isAdmin } from "@/lib/session";
import { formatShortDate } from "@/lib/time";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Jobs" };

const STATUS_LABEL: Record<JobStatus, string> = {
  due: "Due",
  overdue: "Overdue",
  ok: "OK",
  out_of_season: "Not in season",
};

function badgeClass(status: JobStatus): string {
  if (status === "overdue") return "bg-destructive text-white";
  if (status === "due") return "bg-destructive/10 text-destructive";
  if (status === "ok") return "bg-accent text-accent-foreground";
  return "bg-secondary text-secondary-foreground";
}

export default async function JobsPage() {
  if (!(await isAdmin())) redirect("/admin/login");
  const book = await openBook();
  if (!book.ok) return null;

  const rows = jobBoard(await book.store.listJobLogs());
  const byTask = new Map(rows.map((row) => [row.task, row]));
  const due = rows.filter((row) => row.status === "due").length;
  const overdue = rows.filter((row) => row.status === "overdue").length;

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="font-heading text-3xl tracking-tight">Jobs</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {due + overdue === 0
            ? "Nothing is due."
            : `${due} due${overdue > 0 ? `, ${overdue} overdue` : ""}.`}
        </p>
      </div>
      {JOB_GROUPS.map((group, index) => (
        <section key={group[0]} className={index > 0 ? "border-t border-border pt-5" : undefined}>
          <div className="grid gap-3 lg:grid-cols-2">
            {group.map((task) => {
              const row = byTask.get(task);
              if (!row) return null;
              const last =
                row.lastDoneOn && row.lastDoneBy
                  ? `Last done ${formatShortDate(row.lastDoneOn)} by ${row.lastDoneBy}`
                  : "Not logged yet";
              return (
                <article key={task} className="flex flex-col gap-1 rounded-2xl bg-card px-4 py-4 shadow-sm ring-1 ring-border">
                  <div className="flex items-start justify-between gap-3">
                    <h2 className="font-heading text-xl leading-snug">{task}</h2>
                    <span className={cn("shrink-0 rounded-full px-2.5 py-1 text-sm font-semibold", badgeClass(row.status))}>
                      {STATUS_LABEL[row.status]}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">{row.frequency}</p>
                  <p className="text-sm">{last}</p>
                  {row.dueOn ? <p className="text-sm text-muted-foreground">Due {formatShortDate(row.dueOn)}</p> : null}
                </article>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}

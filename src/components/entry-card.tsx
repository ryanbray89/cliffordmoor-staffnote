import { setCharged, setStatus } from "@/lib/actions";
import { STATUS_LABEL, TYPE_LABEL } from "@/lib/catalog";
import { dayLabel, formatLogged, londonToday } from "@/lib/time";
import type { Entry, EntryStatus } from "@/lib/types";
import { RemoveLog } from "@/components/remove-log";
import { ReplyBox } from "@/components/reply-box";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

function Meta({ entry }: { entry: Entry }) {
  const happened =
    entry.happenedOn && entry.happenedOn !== londonToday(new Date(entry.createdAt))
      ? dayLabel(entry.happenedOn)
      : "";
  const bits = [entry.staffName, formatLogged(entry.createdAt), happened].filter(Boolean);
  return <p className="text-sm text-muted-foreground">{bits.join(" · ")}</p>;
}

export function EntryCard({ entry }: { entry: Entry }) {
  return (
    <Card className={cn("gap-3", entry.urgent && "ring-2 ring-destructive")}>
      <CardHeader>
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className="rounded-full bg-secondary px-2.5 py-1 font-semibold">{TYPE_LABEL[entry.type]}</span>
          <span className="rounded-full bg-primary px-2.5 py-1 font-semibold text-primary-foreground">
            {STATUS_LABEL[entry.status]}
          </span>
          {entry.urgent ? (
            <span className="rounded-full bg-destructive px-2.5 py-1 font-semibold text-white">Urgent</span>
          ) : null}
          {entry.jobState === "needs_doing" ? (
            <span className="rounded-full bg-destructive/10 px-2.5 py-1 font-semibold text-destructive">Needs doing</span>
          ) : null}
          {entry.jobState === "done" ? (
            <span className="rounded-full bg-accent px-2.5 py-1 font-semibold text-accent-foreground">Done on the yard</span>
          ) : null}
          {entry.sample ? (
            <span className="rounded-full bg-straw px-2.5 py-1 font-semibold text-foreground">Sample</span>
          ) : null}
        </div>
        <CardTitle className="font-heading text-2xl">{entry.type === "extra_dog_work" ? entry.dogName : entry.title}</CardTitle>
        {entry.type === "extra_dog_work" ? (
          <p className="text-base font-medium">
            {entry.title}
            {entry.quantity ? ` · ×${entry.quantity}` : ""}
            {entry.durationMins ? ` · ${entry.durationMins} min` : ""}
          </p>
        ) : null}
        <Meta entry={entry} />
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {entry.type === "extra_dog_work" ? (
          <p className="text-sm text-muted-foreground">
            {[entry.kennel ? `Kennel ${entry.kennel}` : "", entry.ownerName ? `Owner ${entry.ownerName}` : ""]
              .filter(Boolean)
              .join(" · ") || "No kennel or owner noted"}
          </p>
        ) : null}
        {entry.type === "note" && entry.dogName ? (
          <p className="text-sm text-muted-foreground">About {entry.dogName}</p>
        ) : null}
        {entry.area ? <p className="text-sm text-muted-foreground">{entry.area}</p> : null}
        {entry.detail ? <p className="whitespace-pre-wrap text-base leading-relaxed">{entry.detail}</p> : null}
        {entry.hasPhoto ? (
          // User photos are served from our own route at an unknown size.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={`/api/photos/${entry.id}`}
            alt={`Photo with ${entry.staffName}'s log`}
            className="max-h-72 w-full rounded-xl object-cover"
          />
        ) : null}

        <form action={setStatus} className="grid grid-cols-3 gap-2">
          <input type="hidden" name="id" value={entry.id} />
          {(["new", "seen", "done"] as const satisfies readonly EntryStatus[]).map((status) => (
            <button
              key={status}
              type="submit"
              name="status"
              value={status}
              aria-pressed={entry.status === status}
              className={buttonVariants({
                variant: entry.status === status ? "default" : "outline",
                className: "h-12 rounded-xl text-base",
              })}
            >
              {STATUS_LABEL[status]}
            </button>
          ))}
        </form>

        {entry.type === "extra_dog_work" ? (
          <form action={setCharged} className="grid grid-cols-2 gap-2">
            <input type="hidden" name="id" value={entry.id} />
            <button
              type="submit"
              name="charged"
              value="no"
              aria-pressed={entry.charged === false}
              className={buttonVariants({
                variant: entry.charged === false ? "default" : "outline",
                className: "h-12 rounded-xl text-base",
              })}
            >
              Not charged
            </button>
            <button
              type="submit"
              name="charged"
              value="yes"
              aria-pressed={entry.charged === true}
              className={buttonVariants({
                variant: entry.charged === true ? "default" : "outline",
                className: "h-12 rounded-xl text-base",
              })}
            >
              Charged
            </button>
          </form>
        ) : null}

        {entry.replies.length > 0 ? (
          <ul className="flex flex-col gap-2">
            {entry.replies.map((reply) => (
              <li key={reply.id} className="rounded-2xl bg-straw px-4 py-3">
                <p className="text-sm font-semibold">
                  {reply.authorName} · {formatLogged(reply.createdAt)}
                </p>
                <p className="mt-1 whitespace-pre-wrap text-base">{reply.body}</p>
              </li>
            ))}
          </ul>
        ) : null}

        <ReplyBox entryId={entry.id} />
        <div className="flex justify-end">
          <RemoveLog id={entry.id} />
        </div>
      </CardContent>
    </Card>
  );
}

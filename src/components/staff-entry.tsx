import { STATUS_LABEL, TYPE_LABEL } from "@/lib/catalog";
import { dayLabel, formatLogged, londonToday } from "@/lib/time";
import type { Entry } from "@/lib/types";

export function StaffEntry({ entry }: { entry: Entry }) {
  const headline =
    entry.type === "extra_dog_work" ? `${entry.title} for ${entry.dogName}` : entry.type === "note" ? entry.title : entry.title;
  return (
    <article className="rounded-2xl bg-card px-4 py-4 shadow-sm ring-1 ring-border">
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <span className="font-semibold">{TYPE_LABEL[entry.type]}</span>
        <span className="text-muted-foreground">{STATUS_LABEL[entry.status]}</span>
        {entry.urgent ? <span className="font-semibold text-destructive">Urgent</span> : null}
        {entry.jobState === "needs_doing" ? <span className="font-semibold text-destructive">Needs doing</span> : null}
        {entry.type === "extra_dog_work" ? (
          <span className="text-muted-foreground">{entry.charged ? "Charged" : "To charge"}</span>
        ) : null}
      </div>
      <h3 className="mt-1 text-lg font-semibold">{headline}</h3>
      <p className="text-sm text-muted-foreground">
        {formatLogged(entry.createdAt)}
        {entry.happenedOn && entry.happenedOn !== londonToday(new Date(entry.createdAt))
          ? ` · ${dayLabel(entry.happenedOn)}`
          : ""}
        {entry.kennel ? ` · Kennel ${entry.kennel}` : ""}
      </p>
      {entry.detail ? <p className="mt-2 whitespace-pre-wrap text-base">{entry.detail}</p> : null}
      {entry.hasPhoto ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={`/api/photos/${entry.id}`}
          alt=""
          className="mt-3 max-h-56 w-full rounded-xl object-cover"
        />
      ) : null}
      {entry.replies.map((reply) => (
        <div key={reply.id} className="mt-3 rounded-2xl bg-straw px-3 py-3">
          <p className="text-sm font-semibold">
            {reply.authorName} replied · {formatLogged(reply.createdAt)}
          </p>
          <p className="mt-1 whitespace-pre-wrap text-base">{reply.body}</p>
        </div>
      ))}
    </article>
  );
}

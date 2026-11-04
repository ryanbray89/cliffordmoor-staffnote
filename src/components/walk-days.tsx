import { formatShortDate } from "@/lib/time";

export function WalkDays({ dates }: { dates: string[] | null | undefined }) {
  if (!dates || dates.length === 0) return null;
  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm font-medium">Walk days</p>
      <ul className="flex flex-wrap gap-2" aria-label="Walk days">
        {dates.map((date) => (
          <li
            key={date}
            className="inline-flex h-9 items-center rounded-full bg-accent px-3 text-sm font-semibold text-accent-foreground"
          >
            {formatShortDate(date)}
          </li>
        ))}
      </ul>
    </div>
  );
}

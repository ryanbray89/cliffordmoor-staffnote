import { isIsoDate } from "@/lib/time";

function isoDay(value: unknown): string | null {
  const day = String(value).trim().replace(/^"|"$/g, "").slice(0, 10);
  return isIsoDate(day) ? day : null;
}

export function readWalkDates(value: unknown): string[] | null {
  if (value == null) return null;

  let raw: unknown[] | null = null;
  if (Array.isArray(value)) {
    raw = value;
  } else if (typeof value === "string") {
    const trimmed = value.trim();
    if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
      const inner = trimmed.slice(1, -1).trim();
      raw = inner.length === 0 ? [] : inner.split(",");
    }
  }
  if (!raw) return null;

  const dates: string[] = [];
  for (const item of raw) {
    const day = isoDay(item);
    if (day && !dates.includes(day)) dates.push(day);
  }
  dates.sort();
  return dates.length > 0 ? dates : null;
}

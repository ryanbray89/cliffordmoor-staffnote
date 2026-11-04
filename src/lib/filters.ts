import type { Entry, EntryStatus, EntryType, Filters } from "@/lib/types";
import { isIsoDate } from "@/lib/time";

export const EMPTY_FILTERS: Filters = {
  type: "all",
  status: "all",
  staffId: "all",
  dog: "",
  from: "",
  to: "",
  charged: "all",
  needsDoing: false,
};

export function one(value: string | string[] | null | undefined): string {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

function oneOf<T extends string, F extends string>(
  value: string | null,
  allowed: readonly T[],
  fallback: F,
): T | F {
  if (value && (allowed as readonly string[]).includes(value)) return value as T;
  return fallback;
}

export function parseFilters(params: URLSearchParams): Filters {
  const type = oneOf(
    params.get("type"),
    ["extra_job", "extra_dog_work", "note"] as const satisfies readonly EntryType[],
    "all",
  );
  const status = oneOf(
    params.get("status"),
    ["new", "seen", "done"] as const satisfies readonly EntryStatus[],
    "all",
  );
  const charged = oneOf(params.get("charged"), ["charged", "not_charged"] as const, "all");
  let from = params.get("from") ?? "";
  let to = params.get("to") ?? "";
  if (from && !isIsoDate(from)) from = "";
  if (to && !isIsoDate(to)) to = "";
  if (from && to && from > to) {
    const swap = from;
    from = to;
    to = swap;
  }
  const staff = (params.get("staff") ?? "").trim().slice(0, 80);
  return {
    type,
    status,
    staffId: staff || "all",
    dog: (params.get("dog") ?? "").trim().slice(0, 60),
    from,
    to,
    charged,
    needsDoing: params.get("needs") === "1",
  };
}

export function filtersToQuery(filters: Filters): string {
  const params = new URLSearchParams();
  if (filters.type !== "all") params.set("type", filters.type);
  if (filters.status !== "all") params.set("status", filters.status);
  if (filters.staffId !== "all") params.set("staff", filters.staffId);
  if (filters.dog) params.set("dog", filters.dog);
  if (filters.from) params.set("from", filters.from);
  if (filters.to) params.set("to", filters.to);
  if (filters.charged !== "all") params.set("charged", filters.charged);
  if (filters.needsDoing) params.set("needs", "1");
  return params.toString();
}

export function inboxHref(filters: Filters): string {
  const query = filtersToQuery(filters);
  return query ? `/admin?${query}` : "/admin";
}

export function exportHref(filters: Filters): string {
  const query = filtersToQuery(filters);
  return query ? `/api/admin/export?${query}` : "/api/admin/export";
}

export function hasFilters(filters: Filters): boolean {
  return filtersToQuery(filters).length > 0;
}

export function matchesFilters(entry: Entry, filters: Filters): boolean {
  if (filters.type !== "all" && entry.type !== filters.type) return false;
  if (filters.status !== "all" && entry.status !== filters.status) return false;
  if (filters.staffId !== "all" && entry.staffId !== filters.staffId) return false;
  if (filters.from && entry.happenedOn < filters.from) return false;
  if (filters.to && entry.happenedOn > filters.to) return false;
  if (filters.charged === "charged" && entry.charged !== true) return false;
  if (filters.charged === "not_charged" && entry.charged !== false) return false;
  if (filters.needsDoing && entry.jobState !== "needs_doing") return false;
  if (filters.dog) {
    const dog = entry.dogName?.toLowerCase() ?? "";
    if (!dog.includes(filters.dog.trim().toLowerCase())) return false;
  }
  return true;
}

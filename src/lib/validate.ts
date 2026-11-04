import {
  JOB_TASKS,
  MAX_TITLE_LENGTH,
  MAX_WALK_DAYS,
  WALK_FUTURE_DAYS,
  WALK_MINUTES,
  WALK_PAST_DAYS,
  WALK_TITLE,
} from "@/lib/catalog";
import { isIsoDate, shiftCivilDate } from "@/lib/time";
import type { EntryType, JobState, NewEntry } from "@/lib/types";

export type RawEntry = {
  type: string;
  title: string;
  detail: string;
  dogName: string;
  ownerName: string;
  kennel: string;
  area: string;
  jobState: string;
  jobTasks: string[];
  jobOther: string;
  walkDates: string[];
  urgent: boolean;
  happenedOn: string;
};

export type EntryFields = Omit<NewEntry, "staffId" | "staffName" | "photo">;

function line(value: string, max: number): string {
  return value.replace(/\s+/g, " ").trim().slice(0, max);
}

function prose(value: string, max: number): string {
  return value.replace(/\r\n/g, "\n").trim().slice(0, max);
}

function emptyToNull(value: string): string | null {
  return value.length > 0 ? value : null;
}

export function cleanPersonName(value: string): string | null {
  const name = line(value, 40);
  if (!name) return null;
  return name;
}

function buildJobTitle(
  tasks: string[],
  other: string,
): { ok: true; title: string } | { ok: false; error: string } {
  const picked = new Set(tasks.map((task) => task.trim()).filter(Boolean));
  const ordered: string[] = JOB_TASKS.filter((task) => picked.has(task));
  const custom = line(other, 80);
  if (custom && !ordered.includes(custom)) ordered.push(custom);
  if (ordered.length === 0) return { ok: false, error: "Say what the job is." };
  const title = ordered.join("\n");
  if (title.length > MAX_TITLE_LENGTH) {
    return { ok: false, error: "That is too many jobs for one log. Split it into two." };
  }
  return { ok: true, title };
}

function selectWalkDates(
  values: string[],
  today: string,
): { ok: true; dates: string[] } | { ok: false; error: string } {
  const dates: string[] = [];
  for (const value of values) {
    const day = value.trim();
    if (!day) continue;
    if (!isIsoDate(day)) return { ok: false, error: "Choose the days to walk." };
    if (!dates.includes(day)) dates.push(day);
  }
  dates.sort();
  if (dates.length === 0) return { ok: false, error: "Choose the days to walk." };
  if (dates.length > MAX_WALK_DAYS) return { ok: false, error: "You can pick up to 20 days." };
  const earliest = shiftCivilDate(today, -WALK_PAST_DAYS);
  const latest = shiftCivilDate(today, WALK_FUTURE_DAYS);
  if (dates.some((day) => day < earliest || day > latest)) {
    return { ok: false, error: "Choose days from the last 30 days or the next 60 days." };
  }
  return { ok: true, dates };
}

export function validateEntry(
  raw: RawEntry,
  ctx: { today: string },
): { ok: true; value: EntryFields } | { ok: false; error: string } {
  const type = raw.type;
  if (type !== "extra_job" && type !== "extra_dog_work" && type !== "note") {
    return { ok: false, error: "Choose what you are logging." };
  }

  const happenedOn = raw.happenedOn.trim();
  if (!isIsoDate(happenedOn)) {
    return { ok: false, error: "Choose the date." };
  }
  const earliest = shiftCivilDate(ctx.today, -14);
  if (happenedOn > ctx.today) {
    return { ok: false, error: "That date is in the future." };
  }
  if (happenedOn < earliest) {
    return { ok: false, error: "That date is too far back. Use the last 14 days." };
  }

  let title = line(raw.title, 80);
  const detail = prose(raw.detail, 1000);
  const dogName = emptyToNull(line(raw.dogName, 60));
  const ownerName = emptyToNull(line(raw.ownerName, 80));
  const kennel = emptyToNull(line(raw.kennel, 12));
  const area = emptyToNull(line(raw.area, 40));

  if (type === "extra_dog_work" && !dogName) {
    return { ok: false, error: "Add the dog's name." };
  }
  if (type === "note" && !title) {
    return { ok: false, error: "Choose what sort of note this is." };
  }
  if (type === "note" && !detail) {
    return { ok: false, error: "Write the note for Ryan." };
  }

  let jobState: JobState | null = null;
  if (type === "extra_job") {
    const built = buildJobTitle(raw.jobTasks, raw.jobOther);
    if (!built.ok) return built;
    title = built.title;
    if (raw.jobState !== "done" && raw.jobState !== "needs_doing") {
      return { ok: false, error: "Say whether it is done or still needs doing." };
    }
    jobState = raw.jobState;
  }

  let walkDates: string[] | null = null;
  let quantity: number | null = null;
  let durationMins: number | null = null;
  if (type === "extra_dog_work") {
    const selected = selectWalkDates(raw.walkDates, ctx.today);
    if (!selected.ok) return selected;
    walkDates = selected.dates;
    quantity = selected.dates.length;
    durationMins = WALK_MINUTES;
    title = WALK_TITLE;
  }

  const entryType = type as EntryType;
  return {
    ok: true,
    value: {
      type: entryType,
      title,
      detail,
      dogName: entryType === "extra_job" ? null : dogName,
      ownerName: entryType === "extra_dog_work" ? ownerName : null,
      kennel: entryType === "extra_dog_work" ? kennel : null,
      area: entryType === "extra_job" ? area : null,
      jobState,
      quantity,
      durationMins,
      walkDates,
      urgent: raw.urgent,
      happenedOn,
    },
  };
}

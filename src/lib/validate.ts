import { DURATIONS } from "@/lib/catalog";
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
  quantity: string;
  durationMins: string;
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

  const title = line(raw.title, 80);
  const detail = prose(raw.detail, 1000);
  const dogName = emptyToNull(line(raw.dogName, 60));
  const ownerName = emptyToNull(line(raw.ownerName, 80));
  const kennel = emptyToNull(line(raw.kennel, 12));
  const area = emptyToNull(line(raw.area, 40));

  if (type === "extra_job" && !title) {
    return { ok: false, error: "Say what the job is." };
  }
  if (type === "extra_dog_work" && !title) {
    return { ok: false, error: "Say what was done." };
  }
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
    if (raw.jobState !== "done" && raw.jobState !== "needs_doing") {
      return { ok: false, error: "Say whether it is done or still needs doing." };
    }
    jobState = raw.jobState;
  }

  let quantity: number | null = null;
  if (type === "extra_dog_work") {
    const parsed = Number(raw.quantity || "1");
    if (!Number.isInteger(parsed) || parsed < 1 || parsed > 20) {
      return { ok: false, error: "Quantity needs to be between 1 and 20." };
    }
    quantity = parsed;
  }

  let durationMins: number | null = null;
  if (type === "extra_dog_work" && raw.durationMins.trim()) {
    const parsed = Number(raw.durationMins);
    if (!(DURATIONS as readonly number[]).includes(parsed)) {
      return { ok: false, error: "Choose one of the times, or leave it blank." };
    }
    durationMins = parsed;
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
      urgent: raw.urgent,
      happenedOn,
    },
  };
}

import { MAX_WALK_DAYS, WALK_FUTURE_DAYS, WALK_PAST_DAYS } from "@/lib/catalog";
import { isIsoDate, shiftCivilDate } from "@/lib/time";

export type WalkDogRecord = {
  id: string;
  dogName: string;
  note: string | null;
  createdByName: string;
  createdAt: string;
  active: boolean;
};

export type WalkDayRecord = {
  id: string;
  walkDogId: string;
  walkDate: string;
  doneAt: string | null;
  doneBy: string | null;
  doneByName: string | null;
};

export type WalkDog = WalkDogRecord & {
  days: WalkDayRecord[];
};

export type WalkOnDay = {
  dog: WalkDog;
  day: WalkDayRecord;
};

function line(value: string, max: number): string {
  return value.replace(/\s+/g, " ").trim().slice(0, max);
}

export function normalizeWalkDogs(value: unknown): WalkDogRecord[] {
  if (!Array.isArray(value)) return [];
  const dogs: WalkDogRecord[] = [];
  for (const raw of value) {
    if (!raw || typeof raw !== "object") continue;
    const row = raw as Partial<WalkDogRecord>;
    if (typeof row.id !== "string" || typeof row.dogName !== "string" || row.dogName.trim().length === 0) continue;
    dogs.push({
      id: row.id,
      dogName: row.dogName.trim(),
      note: typeof row.note === "string" && row.note.trim().length > 0 ? row.note.trim() : null,
      createdByName: typeof row.createdByName === "string" && row.createdByName.trim() ? row.createdByName.trim() : "Someone",
      createdAt: typeof row.createdAt === "string" ? row.createdAt : "1970-01-01T00:00:00.000Z",
      active: row.active !== false,
    });
  }
  return dogs;
}

export function normalizeWalkDays(value: unknown): WalkDayRecord[] {
  if (!Array.isArray(value)) return [];
  const days: WalkDayRecord[] = [];
  for (const raw of value) {
    if (!raw || typeof raw !== "object") continue;
    const row = raw as Partial<WalkDayRecord>;
    if (typeof row.id !== "string" || typeof row.walkDogId !== "string" || typeof row.walkDate !== "string") continue;
    if (!isIsoDate(row.walkDate)) continue;
    const doneAt = typeof row.doneAt === "string" ? row.doneAt : null;
    const doneByName = typeof row.doneByName === "string" && row.doneByName.trim() ? row.doneByName.trim() : null;
    days.push({
      id: row.id,
      walkDogId: row.walkDogId,
      walkDate: row.walkDate,
      doneAt: doneAt && doneByName ? doneAt : null,
      doneBy: doneAt && doneByName && typeof row.doneBy === "string" ? row.doneBy : null,
      doneByName: doneAt && doneByName ? doneByName : null,
    });
  }
  return days;
}

export function joinWalkPlan(dogs: WalkDogRecord[], days: WalkDayRecord[]): WalkDog[] {
  return dogs
    .map((dog) => ({
      ...dog,
      days: days
        .filter((day) => day.walkDogId === dog.id)
        .sort((a, b) => a.walkDate.localeCompare(b.walkDate)),
    }))
    .sort((a, b) => a.dogName.localeCompare(b.dogName, "en-GB"));
}

export function walksOn(dogs: WalkDog[], date: string): WalkOnDay[] {
  const rows: WalkOnDay[] = [];
  for (const dog of dogs) {
    const day = dog.days.find((item) => item.walkDate === date);
    if (!day) continue;
    if (!dog.active && !day.doneAt) continue;
    rows.push({ dog, day });
  }
  rows.sort((a, b) => {
    const done = Number(Boolean(a.day.doneAt)) - Number(Boolean(b.day.doneAt));
    if (done !== 0) return done;
    return a.dog.dogName.localeCompare(b.dog.dogName, "en-GB");
  });
  return rows;
}

export function clampWalkDay(value: string, today: string): string {
  if (!isIsoDate(value)) return today;
  const earliest = shiftCivilDate(today, -WALK_PAST_DAYS);
  const latest = shiftCivilDate(today, WALK_FUTURE_DAYS);
  if (value < earliest || value > latest) return today;
  return value;
}

export function validateWalkPlan(
  raw: { dogName: string; note: string; dates: string[] },
  today: string,
): { ok: true; value: { dogName: string; note: string | null; dates: string[] } } | { ok: false; error: string } {
  const dogName = line(raw.dogName, 60);
  if (!dogName) return { ok: false, error: "Add the dog's name." };
  const note = line(raw.note, 120);
  const dates: string[] = [];
  for (const value of raw.dates) {
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
  return { ok: true, value: { dogName, note: note.length > 0 ? note : null, dates } };
}

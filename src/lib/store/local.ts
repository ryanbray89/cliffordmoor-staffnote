import { randomUUID } from "node:crypto";
import { mkdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import path from "node:path";

import { matchesFilters } from "@/lib/filters";
import type { ShoppingItem } from "@/lib/shopping";
import { buildSeed, type Database, type StoredEntry } from "@/lib/seed";
import type { Entry, Reply, Staff } from "@/lib/types";
import { readWalkDates } from "@/lib/walk-dates";
import type { PhotoFile, Store } from "@/lib/store/types";

const locks = new Map<string, Promise<unknown>>();

function withLock<T>(dir: string, fn: () => Promise<T>): Promise<T> {
  const previous = locks.get(dir) ?? Promise.resolve();
  const run = previous.then(fn, fn);
  locks.set(
    dir,
    run.then(
      () => undefined,
      () => undefined,
    ),
  );
  return run;
}

function bookPath(dir: string): string {
  return path.join(dir, "staff-note.json");
}

function photoPath(dir: string, filename: string): string {
  return path.join(dir, "photos", filename);
}

function safePhotoName(filename: string | null): string | null {
  if (!filename) return null;
  if (filename.includes("/") || filename.includes("\\") || filename.includes("..")) return null;
  return filename;
}

function hydrate(db: Database, entry: StoredEntry): Entry {
  return {
    id: entry.id,
    type: entry.type,
    staffId: entry.staffId,
    staffName: entry.staffName,
    title: entry.title,
    detail: entry.detail,
    dogName: entry.dogName,
    ownerName: entry.ownerName,
    kennel: entry.kennel,
    area: entry.area,
    jobState: entry.jobState,
    quantity: entry.quantity,
    durationMins: entry.durationMins,
    walkDates: readWalkDates(entry.walkDates),
    urgent: entry.urgent,
    happenedOn: entry.happenedOn,
    status: entry.status,
    charged: entry.charged,
    sample: entry.sample,
    hasPhoto: Boolean(safePhotoName(entry.photoPath)),
    createdAt: entry.createdAt,
    updatedAt: entry.updatedAt,
    replies: db.replies
      .filter((reply) => reply.entryId === entry.id)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
  };
}

function normalizeShopping(value: unknown): ShoppingItem[] {
  if (!Array.isArray(value)) return [];
  const items: ShoppingItem[] = [];
  for (const raw of value) {
    if (!raw || typeof raw !== "object") continue;
    const row = raw as Partial<ShoppingItem>;
    if (typeof row.id !== "string" || typeof row.item !== "string") continue;
    if (row.status !== "needed" && row.status !== "bought") continue;
    items.push({
      id: row.id,
      item: row.item,
      quantity: typeof row.quantity === "string" && row.quantity.length > 0 ? row.quantity : null,
      note: typeof row.note === "string" && row.note.length > 0 ? row.note : null,
      addedBy: typeof row.addedBy === "string" ? row.addedBy : null,
      addedByName: typeof row.addedByName === "string" && row.addedByName.length > 0 ? row.addedByName : "Someone",
      status: row.status,
      boughtAt: typeof row.boughtAt === "string" ? row.boughtAt : null,
      boughtByName: typeof row.boughtByName === "string" ? row.boughtByName : null,
      createdAt: typeof row.createdAt === "string" ? row.createdAt : "1970-01-01T00:00:00.000Z",
    });
  }
  return items;
}

function compareStaff(a: Staff, b: Staff): number {
  return a.sortOrder - b.sortOrder || a.name.localeCompare(b.name, "en-GB");
}

async function writeDb(dir: string, db: Database): Promise<void> {
  await mkdir(dir, { recursive: true });
  const file = bookPath(dir);
  const temporary = `${file}.tmp`;
  await writeFile(temporary, JSON.stringify(db, null, 2));
  try {
    await rename(temporary, file);
  } catch {
    await rm(file, { force: true });
    await rename(temporary, file);
  }
}

async function readDb(dir: string): Promise<Database> {
  const file = bookPath(dir);
  try {
    const raw = await readFile(file, "utf8");
    try {
      const parsed = JSON.parse(raw) as Database;
      if (!parsed || !Array.isArray(parsed.staff) || !Array.isArray(parsed.entries) || !Array.isArray(parsed.replies)) {
        throw new Error("shape");
      }
      parsed.shopping = normalizeShopping(parsed.shopping);
      return parsed;
    } catch {
      throw new Error("The local Staff Note file is damaged. Check data/staff-note.json.");
    }
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      const seeded = buildSeed();
      await writeDb(dir, seeded);
      return seeded;
    }
    throw error;
  }
}

async function removePhoto(dir: string, filename: string | null): Promise<void> {
  const safe = safePhotoName(filename);
  if (!safe) return;
  await rm(photoPath(dir, safe), { force: true });
}

export function createLocalStore(dir = process.env.YARD_DATA_DIR || path.join(process.cwd(), "data")): Store {
  return {
    async listStaff(options) {
      return withLock(dir, async () => {
        const db = await readDb(dir);
        return db.staff
          .filter((person) => options?.includeInactive || person.active)
          .sort(compareStaff);
      });
    },

    async getStaff(id) {
      return withLock(dir, async () => {
        const db = await readDb(dir);
        return db.staff.find((person) => person.id === id) ?? null;
      });
    },

    async createStaff(name) {
      return withLock(dir, async () => {
        const db = await readDb(dir);
        if (db.staff.some((person) => person.name.toLowerCase() === name.toLowerCase())) {
          throw new Error("duplicate");
        }
        const person: Staff = {
          id: randomUUID(),
          name,
          active: true,
          sortOrder: db.staff.reduce((max, item) => Math.max(max, item.sortOrder), -1) + 1,
          createdAt: new Date().toISOString(),
        };
        db.staff.push(person);
        await writeDb(dir, db);
        return person;
      });
    },

    async renameStaff(id, name) {
      return withLock(dir, async () => {
        const db = await readDb(dir);
        const person = db.staff.find((item) => item.id === id);
        if (!person) throw new Error("missing");
        if (db.staff.some((item) => item.id !== id && item.name.toLowerCase() === name.toLowerCase())) {
          throw new Error("duplicate");
        }
        person.name = name;
        await writeDb(dir, db);
        return person;
      });
    },

    async setStaffActive(id, active) {
      return withLock(dir, async () => {
        const db = await readDb(dir);
        const person = db.staff.find((item) => item.id === id);
        if (!person) throw new Error("missing");
        person.active = active;
        await writeDb(dir, db);
        return person;
      });
    },

    async moveStaff(id, direction) {
      await withLock(dir, async () => {
        const db = await readDb(dir);
        const ordered = [...db.staff].sort(compareStaff);
        const index = ordered.findIndex((person) => person.id === id);
        if (index < 0) throw new Error("missing");
        const target = direction === "up" ? index - 1 : index + 1;
        if (target < 0 || target >= ordered.length) return;
        const [person] = ordered.splice(index, 1);
        ordered.splice(target, 0, person);
        ordered.forEach((item, order) => {
          item.sortOrder = order;
        });
        db.staff = ordered;
        await writeDb(dir, db);
      });
    },

    async createEntry(input) {
      return withLock(dir, async () => {
        const db = await readDb(dir);
        const now = new Date().toISOString();
        const id = randomUUID();
        let filename: string | null = null;
        let contentType: string | null = null;
        if (input.photo) {
          filename = `${id}.${input.photo.ext}`;
          await mkdir(path.join(dir, "photos"), { recursive: true });
          await writeFile(photoPath(dir, filename), input.photo.bytes);
          contentType = input.photo.contentType;
        }
        const walkDates = input.type === "extra_dog_work" ? readWalkDates(input.walkDates) : null;
        const entry: StoredEntry = {
          id,
          type: input.type,
          staffId: input.staffId,
          staffName: input.staffName,
          title: input.title,
          detail: input.detail,
          dogName: input.dogName,
          ownerName: input.ownerName,
          kennel: input.kennel,
          area: input.area,
          jobState: input.jobState,
          quantity: walkDates ? walkDates.length : input.quantity,
          durationMins: input.durationMins,
          walkDates,
          urgent: input.urgent,
          happenedOn: input.happenedOn,
          status: "new",
          charged: input.type === "extra_dog_work" ? false : null,
          sample: false,
          photoPath: filename,
          photoContentType: contentType,
          createdAt: now,
          updatedAt: now,
        };
        db.entries.push(entry);
        await writeDb(dir, db);
        return hydrate(db, entry);
      });
    },

    async listEntries(filters, limit = 500) {
      return withLock(dir, async () => {
        const db = await readDb(dir);
        return db.entries
          .map((entry) => hydrate(db, entry))
          .filter((entry) => matchesFilters(entry, filters))
          .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
          .slice(0, limit);
      });
    },

    async updateEntry(id, patch) {
      return withLock(dir, async () => {
        const db = await readDb(dir);
        const entry = db.entries.find((item) => item.id === id);
        if (!entry) throw new Error("missing");
        if (patch.status) entry.status = patch.status;
        if (patch.charged !== undefined && entry.type === "extra_dog_work") {
          entry.charged = patch.charged;
        }
        entry.updatedAt = new Date().toISOString();
        await writeDb(dir, db);
        return hydrate(db, entry);
      });
    },

    async addReply(entryId, authorName, body) {
      return withLock(dir, async () => {
        const db = await readDb(dir);
        const entry = db.entries.find((item) => item.id === entryId);
        if (!entry) throw new Error("missing");
        const reply: Reply = {
          id: randomUUID(),
          entryId,
          authorName,
          body,
          createdAt: new Date().toISOString(),
        };
        db.replies.push(reply);
        if (entry.status === "new") entry.status = "seen";
        entry.updatedAt = reply.createdAt;
        await writeDb(dir, db);
        return hydrate(db, entry);
      });
    },

    async deleteEntry(id) {
      await withLock(dir, async () => {
        const db = await readDb(dir);
        const entry = db.entries.find((item) => item.id === id);
        if (!entry) return;
        await removePhoto(dir, entry.photoPath);
        db.entries = db.entries.filter((item) => item.id !== id);
        db.replies = db.replies.filter((reply) => reply.entryId !== id);
        await writeDb(dir, db);
      });
    },

    async deleteSamples() {
      await withLock(dir, async () => {
        const db = await readDb(dir);
        const samples = db.entries.filter((entry) => entry.sample);
        for (const entry of samples) {
          await removePhoto(dir, entry.photoPath);
        }
        const ids = new Set(samples.map((entry) => entry.id));
        db.entries = db.entries.filter((entry) => !entry.sample);
        db.replies = db.replies.filter((reply) => !ids.has(reply.entryId));
        await writeDb(dir, db);
      });
    },

    async countNew() {
      return withLock(dir, async () => {
        const db = await readDb(dir);
        return db.entries.filter((entry) => entry.status === "new").length;
      });
    },

    async countSample() {
      return withLock(dir, async () => {
        const db = await readDb(dir);
        return db.entries.filter((entry) => entry.sample).length;
      });
    },

    async listShopping() {
      return withLock(dir, async () => {
        const db = await readDb(dir);
        return [...db.shopping].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      });
    },

    async addShopping(input) {
      return withLock(dir, async () => {
        const db = await readDb(dir);
        const item: ShoppingItem = {
          id: randomUUID(),
          item: input.item,
          quantity: input.quantity,
          note: input.note,
          addedBy: input.addedBy,
          addedByName: input.addedByName,
          status: "needed",
          boughtAt: null,
          boughtByName: null,
          createdAt: new Date().toISOString(),
        };
        db.shopping.push(item);
        await writeDb(dir, db);
        return item;
      });
    },

    async markShoppingBought(id, boughtByName) {
      return withLock(dir, async () => {
        const db = await readDb(dir);
        const item = db.shopping.find((entry) => entry.id === id);
        if (!item) throw new Error("missing");
        if (item.status !== "bought") {
          item.status = "bought";
          item.boughtAt = new Date().toISOString();
          item.boughtByName = boughtByName;
          await writeDb(dir, db);
        }
        return item;
      });
    },

    async deleteShopping(id) {
      await withLock(dir, async () => {
        const db = await readDb(dir);
        db.shopping = db.shopping.filter((entry) => entry.id !== id);
        await writeDb(dir, db);
      });
    },

    async getPhoto(entryId): Promise<PhotoFile | null> {
      return withLock(dir, async () => {
        const db = await readDb(dir);
        const entry = db.entries.find((item) => item.id === entryId);
        const filename = safePhotoName(entry?.photoPath ?? null);
        if (!entry || !filename) return null;
        try {
          const bytes = await readFile(photoPath(dir, filename));
          return { bytes, contentType: entry.photoContentType ?? "image/jpeg" };
        } catch (error) {
          if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
          throw error;
        }
      });
    },
  };
}

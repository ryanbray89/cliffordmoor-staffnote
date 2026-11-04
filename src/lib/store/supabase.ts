import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import type { ShoppingItem } from "@/lib/shopping";
import { readWalkDates } from "@/lib/walk-dates";
import { joinWalkPlan, type WalkDayRecord, type WalkDogRecord } from "@/lib/walks";
import type { Entry, EntryStatus, Filters, NewEntry, Reply, Staff } from "@/lib/types";
import type { Store } from "@/lib/store/types";

const BUCKET = "entry-photos";

type StaffRow = {
  id: string;
  name: string;
  active: boolean;
  sort_order: number;
  created_at: string;
};

type ReplyRow = {
  id: string;
  entry_id: string;
  author_name: string;
  body: string;
  created_at: string;
};

type ShoppingRow = {
  id: string;
  item: string;
  quantity: string | null;
  note: string | null;
  added_by: string | null;
  added_by_name: string | null;
  status: ShoppingItem["status"];
  bought_at: string | null;
  bought_by_name: string | null;
  created_at: string;
};

type EntryRow = {
  id: string;
  type: Entry["type"];
  staff_id: string | null;
  staff_name: string;
  title: string;
  detail: string;
  dog_name: string | null;
  owner_name: string | null;
  kennel: string | null;
  area: string | null;
  job_state: Entry["jobState"];
  quantity: number | null;
  duration_mins: number | null;
  walk_dates?: string[] | string | null;
  urgent: boolean;
  happened_on: string;
  status: EntryStatus;
  charged: boolean | null;
  sample: boolean;
  photo_path: string | null;
  photo_content_type: string | null;
  created_at: string;
  updated_at: string;
  replies?: ReplyRow[];
};

function fail(error: { message: string; code?: string }): never {
  console.error(error);
  if (/walk_dogs|walk_days/i.test(error.message)) {
    throw new Error(
      "The walk plan is not there yet. Run supabase/migrations/004_walk_plan.sql in the SQL editor, then refresh.",
    );
  }
  if (/shopping_items/i.test(error.message)) {
    throw new Error(
      "The shopping list is not there yet. Run supabase/migrations/003_shopping.sql in the SQL editor, then refresh.",
    );
  }
  if (error.code === "42703" || /walk_dates/i.test(error.message)) {
    throw new Error(
      "The walk days column is not there yet. Run supabase/migrations/002_walk_days.sql in the SQL editor, then refresh.",
    );
  }
  if (error.code === "42P01" || /relation .* does not exist/i.test(error.message)) {
    throw new Error(
      "The Supabase tables are not there yet. Run supabase/migrations/001_init.sql in the SQL editor, then refresh.",
    );
  }
  if (/bucket|entry-photos/i.test(error.message)) {
    throw new Error(
      "The entry-photos storage bucket is missing. Run the migration, or create a private bucket named entry-photos.",
    );
  }
  throw new Error("The book could not be reached just now. Try again in a moment.");
}

function mapReply(row: ReplyRow): Reply {
  return {
    id: row.id,
    entryId: row.entry_id,
    authorName: row.author_name,
    body: row.body,
    createdAt: row.created_at,
  };
}

function mapShopping(row: ShoppingRow): ShoppingItem {
  return {
    id: row.id,
    item: row.item,
    quantity: row.quantity,
    note: row.note,
    addedBy: row.added_by,
    addedByName: row.added_by_name?.trim() || "Someone",
    status: row.status === "bought" ? "bought" : "needed",
    boughtAt: row.bought_at,
    boughtByName: row.bought_by_name,
    createdAt: row.created_at,
  };
}

function mapStaff(row: StaffRow): Staff {
  return {
    id: row.id,
    name: row.name,
    active: row.active,
    sortOrder: row.sort_order,
    createdAt: row.created_at,
  };
}

function mapEntry(row: EntryRow): Entry {
  return {
    id: row.id,
    type: row.type,
    staffId: row.staff_id,
    staffName: row.staff_name,
    title: row.title,
    detail: row.detail ?? "",
    dogName: row.dog_name,
    ownerName: row.owner_name,
    kennel: row.kennel,
    area: row.area,
    jobState: row.job_state,
    quantity: row.quantity,
    durationMins: row.duration_mins,
    walkDates: readWalkDates(row.walk_dates),
    urgent: row.urgent,
    happenedOn: row.happened_on,
    status: row.status,
    charged: row.charged,
    sample: row.sample,
    hasPhoto: Boolean(row.photo_path),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    replies: (row.replies ?? [])
      .map(mapReply)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
  };
}

function escapeLike(value: string): string {
  return value.replace(/[\\%_]/g, (char) => `\\${char}`);
}

function compareStaff(a: Staff, b: Staff): number {
  return a.sortOrder - b.sortOrder || a.name.localeCompare(b.name, "en-GB");
}

export function createSupabaseStore(): Store {
  const url = process.env.SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !key) {
    throw new Error("Set both SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.");
  }

  const db: SupabaseClient = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  async function listStaffRows(includeInactive: boolean): Promise<Staff[]> {
    let query = db.from("staff").select("*").order("sort_order", { ascending: true }).order("name");
    if (!includeInactive) query = query.eq("active", true);
    const { data, error } = await query;
    if (error) fail(error);
    return ((data ?? []) as StaffRow[]).map(mapStaff).sort(compareStaff);
  }

  async function loadEntry(id: string): Promise<Entry> {
    const { data, error } = await db.from("entries").select("*, replies(*)").eq("id", id).maybeSingle();
    if (error) fail(error);
    if (!data) throw new Error("missing");
    return mapEntry(data as EntryRow);
  }

  return {
    listStaff(options) {
      return listStaffRows(Boolean(options?.includeInactive));
    },

    async getStaff(id) {
      const { data, error } = await db.from("staff").select("*").eq("id", id).maybeSingle();
      if (error) fail(error);
      return data ? mapStaff(data as StaffRow) : null;
    },

    async createStaff(name) {
      const existing = await listStaffRows(true);
      if (existing.some((person) => person.name.toLowerCase() === name.toLowerCase())) {
        throw new Error("duplicate");
      }
      const sortOrder = existing.reduce((max, person) => Math.max(max, person.sortOrder), -1) + 1;
      const { data, error } = await db
        .from("staff")
        .insert({ name, active: true, sort_order: sortOrder })
        .select("*")
        .single();
      if (error) fail(error);
      return mapStaff(data as StaffRow);
    },

    async renameStaff(id, name) {
      const existing = await listStaffRows(true);
      if (!existing.some((person) => person.id === id)) throw new Error("missing");
      if (existing.some((person) => person.id !== id && person.name.toLowerCase() === name.toLowerCase())) {
        throw new Error("duplicate");
      }
      const { data, error } = await db.from("staff").update({ name }).eq("id", id).select("*").single();
      if (error) fail(error);
      return mapStaff(data as StaffRow);
    },

    async setStaffActive(id, active) {
      const { data, error } = await db.from("staff").update({ active }).eq("id", id).select("*").maybeSingle();
      if (error) fail(error);
      if (!data) throw new Error("missing");
      return mapStaff(data as StaffRow);
    },

    async moveStaff(id, direction) {
      const people = await listStaffRows(true);
      const index = people.findIndex((person) => person.id === id);
      if (index < 0) throw new Error("missing");
      const target = direction === "up" ? index - 1 : index + 1;
      if (target < 0 || target >= people.length) return;
      const [person] = people.splice(index, 1);
      people.splice(target, 0, person);
      for (let order = 0; order < people.length; order += 1) {
        const { error } = await db.from("staff").update({ sort_order: order }).eq("id", people[order].id);
        if (error) fail(error);
      }
    },

    async createEntry(input: NewEntry) {
      const walkDates = input.type === "extra_dog_work" ? readWalkDates(input.walkDates) : null;
      const { data, error } = await db
        .from("entries")
        .insert({
          type: input.type,
          staff_id: input.staffId,
          staff_name: input.staffName,
          title: input.title,
          detail: input.detail,
          dog_name: input.dogName,
          owner_name: input.ownerName,
          kennel: input.kennel,
          area: input.area,
          job_state: input.jobState,
          quantity: walkDates ? walkDates.length : input.quantity,
          duration_mins: input.durationMins,
          walk_dates: walkDates,
          urgent: input.urgent,
          happened_on: input.happenedOn,
          status: "new",
          charged: input.type === "extra_dog_work" ? false : null,
          sample: false,
        })
        .select("*")
        .single();
      if (error) fail(error);
      const row = data as EntryRow;
      if (input.photo) {
        const path = `${row.id}.${input.photo.ext}`;
        const uploaded = await db.storage.from(BUCKET).upload(path, new Uint8Array(input.photo.bytes), {
          contentType: input.photo.contentType,
          upsert: true,
        });
        if (uploaded.error) {
          await db.from("entries").delete().eq("id", row.id);
          fail(uploaded.error);
        }
        const updated = await db
          .from("entries")
          .update({ photo_path: path, photo_content_type: input.photo.contentType })
          .eq("id", row.id);
        if (updated.error) fail(updated.error);
        row.photo_path = path;
        row.photo_content_type = input.photo.contentType;
      }
      row.replies = [];
      return mapEntry(row);
    },

    async listEntries(filters: Filters, limit = 500) {
      let query = db
        .from("entries")
        .select("*, replies(*)")
        .order("created_at", { ascending: false })
        .limit(limit);
      if (filters.type !== "all") query = query.eq("type", filters.type);
      if (filters.status !== "all") query = query.eq("status", filters.status);
      if (filters.staffId !== "all") query = query.eq("staff_id", filters.staffId);
      if (filters.from) query = query.gte("happened_on", filters.from);
      if (filters.to) query = query.lte("happened_on", filters.to);
      if (filters.charged === "charged") query = query.eq("charged", true);
      if (filters.charged === "not_charged") query = query.eq("charged", false);
      if (filters.needsDoing) query = query.eq("job_state", "needs_doing");
      if (filters.dog) query = query.ilike("dog_name", `%${escapeLike(filters.dog)}%`);
      const { data, error } = await query;
      if (error) fail(error);
      return ((data ?? []) as EntryRow[]).map(mapEntry);
    },

    async listJobLogs() {
      const { data, error } = await db
        .from("entries")
        .select("title, staff_name, happened_on, created_at")
        .eq("type", "extra_job")
        .order("happened_on", { ascending: false })
        .limit(5000);
      if (error) fail(error);
      return ((data ?? []) as { title: string; staff_name: string; happened_on: string; created_at: string }[]).map(
        (row) => ({
          title: row.title,
          staffName: row.staff_name,
          happenedOn: row.happened_on,
          createdAt: row.created_at,
        }),
      );
    },

    async listWalkPlan() {
      const { data, error } = await db.from("walk_dogs").select("*, walk_days(*)");
      if (error) fail(error);
      const rows = (data ?? []) as Array<{
        id: string;
        dog_name: string;
        note: string | null;
        created_by_name: string | null;
        created_at: string;
        active: boolean;
        walk_days?: Array<{
          id: string;
          walk_dog_id: string;
          walk_date: string;
          done_at: string | null;
          done_by: string | null;
          done_by_name: string | null;
        }> | null;
      }>;
      const dogs: WalkDogRecord[] = [];
      const days: WalkDayRecord[] = [];
      for (const row of rows) {
        dogs.push({
          id: row.id,
          dogName: row.dog_name,
          note: row.note,
          createdByName: row.created_by_name?.trim() || "Someone",
          createdAt: row.created_at,
          active: row.active,
        });
        for (const day of row.walk_days ?? []) {
          days.push({
            id: day.id,
            walkDogId: day.walk_dog_id,
            walkDate: day.walk_date,
            doneAt: day.done_at,
            doneBy: day.done_by,
            doneByName: day.done_by_name,
          });
        }
      }
      return joinWalkPlan(dogs, days);
    },

    async addWalkDog(input) {
      const { data, error } = await db
        .from("walk_dogs")
        .insert({
          dog_name: input.dogName,
          note: input.note,
          created_by_name: input.createdByName,
          active: true,
        })
        .select("id, created_at")
        .single();
      if (error) fail(error);
      const dog = data as { id: string; created_at: string };
      if (input.dates.length > 0) {
        const inserted = await db.from("walk_days").insert(
          input.dates.map((walkDate) => ({
            walk_dog_id: dog.id,
            walk_date: walkDate,
          })),
        );
        if (inserted.error) {
          await db.from("walk_dogs").delete().eq("id", dog.id);
          fail(inserted.error);
        }
      }
      const plan = await this.listWalkPlan();
      const created = plan.find((item) => item.id === dog.id);
      if (!created) throw new Error("missing");
      return created;
    },

    async updateWalkDog(id, input) {
      const existing = await db.from("walk_dogs").select("id, active").eq("id", id).maybeSingle();
      if (existing.error) fail(existing.error);
      if (!existing.data || !(existing.data as { active: boolean }).active) throw new Error("missing");
      const updated = await db.from("walk_dogs").update({ dog_name: input.dogName, note: input.note }).eq("id", id);
      if (updated.error) fail(updated.error);
      const current = await db.from("walk_days").select("id, walk_date").eq("walk_dog_id", id);
      if (current.error) fail(current.error);
      const rows = (current.data ?? []) as { id: string; walk_date: string }[];
      const keep = new Set(input.dates);
      const remove = rows.filter((row) => !keep.has(row.walk_date)).map((row) => row.id);
      if (remove.length > 0) {
        const deleted = await db.from("walk_days").delete().in("id", remove);
        if (deleted.error) fail(deleted.error);
      }
      const have = new Set(rows.map((row) => row.walk_date));
      const add = input.dates.filter((date) => !have.has(date));
      if (add.length > 0) {
        const inserted = await db.from("walk_days").insert(add.map((walkDate) => ({ walk_dog_id: id, walk_date: walkDate })));
        if (inserted.error) fail(inserted.error);
      }
      const plan = await this.listWalkPlan();
      const dog = plan.find((item) => item.id === id);
      if (!dog) throw new Error("missing");
      return dog;
    },

    async removeWalkDog(id) {
      const { error } = await db.from("walk_dogs").update({ active: false }).eq("id", id);
      if (error) fail(error);
    },

    async markWalkDone(dayId, actor) {
      const current = await db.from("walk_days").select("done_at").eq("id", dayId).maybeSingle();
      if (current.error) fail(current.error);
      if (!current.data) throw new Error("missing");
      if ((current.data as { done_at: string | null }).done_at) return;
      const { error } = await db
        .from("walk_days")
        .update({
          done_at: new Date().toISOString(),
          done_by: actor.staffId,
          done_by_name: actor.name,
        })
        .eq("id", dayId);
      if (error) fail(error);
    },

    async undoWalk(dayId) {
      const { error } = await db
        .from("walk_days")
        .update({ done_at: null, done_by: null, done_by_name: null })
        .eq("id", dayId);
      if (error) fail(error);
    },

    async updateEntry(id, patch) {
      const current = await loadEntry(id);
      const update: { status?: EntryStatus; charged?: boolean; updated_at: string } = {
        updated_at: new Date().toISOString(),
      };
      if (patch.status) update.status = patch.status;
      if (patch.charged !== undefined && current.type === "extra_dog_work") update.charged = patch.charged;
      const { error } = await db.from("entries").update(update).eq("id", id);
      if (error) fail(error);
      return loadEntry(id);
    },

    async addReply(entryId, authorName, body) {
      const current = await loadEntry(entryId);
      const { error } = await db.from("replies").insert({
        entry_id: entryId,
        author_name: authorName,
        body,
      });
      if (error) fail(error);
      const seen = await db
        .from("entries")
        .update({
          ...(current.status === "new" ? { status: "seen" } : {}),
          updated_at: new Date().toISOString(),
        })
        .eq("id", entryId);
      if (seen.error) fail(seen.error);
      return loadEntry(entryId);
    },

    async deleteEntry(id) {
      const { data, error } = await db.from("entries").select("photo_path").eq("id", id).maybeSingle();
      if (error) fail(error);
      if (!data) return;
      const photo = (data as { photo_path: string | null }).photo_path;
      if (photo) {
        const removed = await db.storage.from(BUCKET).remove([photo]);
        if (removed.error) console.error(removed.error);
      }
      const deleted = await db.from("entries").delete().eq("id", id);
      if (deleted.error) fail(deleted.error);
    },

    async deleteSamples() {
      const { data, error } = await db.from("entries").select("id, photo_path").eq("sample", true);
      if (error) fail(error);
      const rows = (data ?? []) as { id: string; photo_path: string | null }[];
      const paths = rows.map((row) => row.photo_path).filter((item): item is string => Boolean(item));
      if (paths.length > 0) {
        const removed = await db.storage.from(BUCKET).remove(paths);
        if (removed.error) console.error(removed.error);
      }
      const deleted = await db.from("entries").delete().eq("sample", true);
      if (deleted.error) fail(deleted.error);
    },

    async countNew() {
      const { count, error } = await db
        .from("entries")
        .select("id", { count: "exact", head: true })
        .eq("status", "new");
      if (error) fail(error);
      return count ?? 0;
    },

    async countSample() {
      const { count, error } = await db
        .from("entries")
        .select("id", { count: "exact", head: true })
        .eq("sample", true);
      if (error) fail(error);
      return count ?? 0;
    },

    async listShopping() {
      const { data, error } = await db
        .from("shopping_items")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) fail(error);
      return ((data ?? []) as ShoppingRow[]).map(mapShopping);
    },

    async addShopping(input) {
      const { data, error } = await db
        .from("shopping_items")
        .insert({
          item: input.item,
          quantity: input.quantity,
          note: input.note,
          added_by: input.addedBy,
          added_by_name: input.addedByName,
          status: "needed",
        })
        .select("*")
        .single();
      if (error) fail(error);
      return mapShopping(data as ShoppingRow);
    },

    async markShoppingBought(id, boughtByName) {
      const current = await db.from("shopping_items").select("*").eq("id", id).maybeSingle();
      if (current.error) fail(current.error);
      if (!current.data) throw new Error("missing");
      const row = current.data as ShoppingRow;
      if (row.status === "bought") return mapShopping(row);
      const boughtAt = new Date().toISOString();
      const updated = await db
        .from("shopping_items")
        .update({ status: "bought", bought_at: boughtAt, bought_by_name: boughtByName })
        .eq("id", id)
        .select("*")
        .single();
      if (updated.error) fail(updated.error);
      return mapShopping(updated.data as ShoppingRow);
    },

    async deleteShopping(id) {
      const { error } = await db.from("shopping_items").delete().eq("id", id);
      if (error) fail(error);
    },

    async getPhoto(entryId) {
      const { data, error } = await db
        .from("entries")
        .select("photo_path, photo_content_type")
        .eq("id", entryId)
        .maybeSingle();
      if (error) fail(error);
      const row = data as { photo_path: string | null; photo_content_type: string | null } | null;
      if (!row?.photo_path) return null;
      const downloaded = await db.storage.from(BUCKET).download(row.photo_path);
      if (downloaded.error || !downloaded.data) return null;
      const bytes = Buffer.from(await downloaded.data.arrayBuffer());
      return { bytes, contentType: row.photo_content_type ?? "image/jpeg" };
    },
  };
}

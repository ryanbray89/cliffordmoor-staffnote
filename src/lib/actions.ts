"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { OFFICE_AUTHOR, logLabel } from "@/lib/catalog";
import { readPhotoFile } from "@/lib/photo";
import {
  adminConfigured,
  checkPin,
  clearOfficeCookie,
  forgetStaff,
  getCurrentStaff,
  isAdmin,
  rememberStaff,
  setOfficeCookie,
} from "@/lib/session";
import { getStore } from "@/lib/store";
import { londonToday } from "@/lib/time";
import type { Entry, EntryStatus } from "@/lib/types";
import { validateShopping } from "@/lib/shopping";
import { isStockStatus, parseStockQuantity, validateKennelsNote, validateStockName } from "@/lib/stock";
import { clampWalkDay, validateWalkPlan } from "@/lib/walks";
import { cleanPersonName, validateEntry, type RawEntry } from "@/lib/validate";

function refresh() {
  revalidatePath("/", "layout");
}

function savedSummary(entry: Pick<Entry, "type" | "title" | "dogName">): string {
  if (entry.type === "note") return "Your note";
  return logLabel(entry);
}

function friendlySaveError(error: unknown): string {
  const message = error instanceof Error ? error.message : "";
  if (
    message.includes("Supabase") ||
    message.includes("tables") ||
    message.includes("shopping") ||
    message.includes("walk plan") ||
    message.includes("stock list") ||
    message.includes("bucket") ||
    message.includes("damaged") ||
    message.includes("SUPABASE_URL")
  ) {
    return message;
  }
  return "Could not save that just now. Try again.";
}

async function requireOffice() {
  if (!(await isAdmin())) redirect("/admin/login");
}

export async function chooseStaff(formData: FormData) {
  const id = String(formData.get("staffId") ?? "");
  const staff = await getStore().getStaff(id);
  if (!staff?.active) redirect("/?pick=1");
  await rememberStaff(staff.id);
  redirect("/");
}

export async function clearStaff() {
  await forgetStaff();
  redirect("/");
}

export async function createEntry(
  _previous: { error?: string },
  formData: FormData,
): Promise<{ error?: string }> {
  const staff = await getCurrentStaff();
  if (!staff) redirect("/?needName=1");

  const raw: RawEntry = {
    type: String(formData.get("type") ?? ""),
    title: String(formData.get("title") ?? ""),
    detail: String(formData.get("detail") ?? ""),
    dogName: String(formData.get("dogName") ?? ""),
    ownerName: String(formData.get("ownerName") ?? ""),
    kennel: String(formData.get("kennel") ?? ""),
    area: String(formData.get("area") ?? ""),
    jobState: String(formData.get("jobState") ?? ""),
    jobTasks: formData.getAll("jobTask").map(String),
    jobOther: String(formData.get("jobOther") ?? ""),
    walkDates: formData.getAll("walkDate").map(String),
    urgent: formData.get("urgent") === "1",
    happenedOn: String(formData.get("happenedOn") ?? ""),
  };

  const validated = validateEntry(raw, { today: londonToday() });
  if (!validated.ok) return { error: validated.error };

  const file = formData.get("photo");
  let photo = null;
  if (file instanceof File) {
    const read = await readPhotoFile(file);
    if (read && !read.ok) return { error: read.error };
    if (read?.ok) photo = read.photo;
  }

  let entry: Entry;
  try {
    entry = await getStore().createEntry({
      ...validated.value,
      staffId: staff.id,
      staffName: staff.name,
      photo,
    });
  } catch (error) {
    console.error(error);
    return { error: friendlySaveError(error) };
  }

  refresh();
  redirect(`/?saved=${encodeURIComponent(savedSummary(entry))}`);
}

export async function unlockOffice(
  _previous: { error?: string },
  formData: FormData,
): Promise<{ error?: string }> {
  if (!adminConfigured()) {
    return {
      error: "The office PIN is not set yet. Add ADMIN_PIN to the server environment.",
    };
  }
  const attempt = String(formData.get("pin") ?? "");
  if (!checkPin(attempt)) {
    await new Promise((resolve) => setTimeout(resolve, 400));
    return { error: "That PIN is not right." };
  }
  await setOfficeCookie();
  redirect("/admin");
}

export async function lockOffice() {
  await clearOfficeCookie();
  redirect("/admin/login");
}

export async function setStatus(formData: FormData) {
  await requireOffice();
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "");
  if (status !== "new" && status !== "seen" && status !== "done") return;
  await getStore().updateEntry(id, { status: status as EntryStatus });
  refresh();
}

export async function setCharged(formData: FormData) {
  await requireOffice();
  const id = String(formData.get("id") ?? "");
  await getStore().updateEntry(id, { charged: formData.get("charged") === "yes" });
  refresh();
}

export async function addReply(entryId: string, body: string): Promise<{ error?: string }> {
  if (!(await isAdmin())) return { error: "The office is locked." };
  const text = body.replace(/\r\n/g, "\n").trim().slice(0, 1000);
  if (!text) return { error: "Write a reply first." };
  try {
    await getStore().addReply(entryId, OFFICE_AUTHOR, text);
  } catch (error) {
    console.error(error);
    return { error: "Could not send that reply." };
  }
  refresh();
  return {};
}

export async function addShoppingItem(
  _previous: { error?: string },
  formData: FormData,
): Promise<{ error?: string }> {
  const staff = await getCurrentStaff();
  if (!staff) redirect("/?needName=1");
  const validated = validateShopping({
    item: String(formData.get("item") ?? ""),
    quantity: String(formData.get("quantity") ?? ""),
    note: String(formData.get("note") ?? ""),
  });
  if (!validated.ok) return { error: validated.error };
  try {
    await getStore().addShopping({
      ...validated.value,
      addedBy: staff.id,
      addedByName: staff.name,
    });
  } catch (error) {
    console.error(error);
    return { error: friendlySaveError(error) };
  }
  refresh();
  redirect("/shopping?saved=1");
}

export async function markShoppingGot(formData: FormData) {
  const staff = await getCurrentStaff();
  if (!staff) redirect("/?needName=1");
  try {
    await getStore().markShoppingBought(String(formData.get("id") ?? ""), staff.name);
  } catch (error) {
    if (error instanceof Error && error.message === "missing") redirect("/shopping");
    throw error;
  }
  refresh();
}

export async function markShoppingBought(formData: FormData) {
  await requireOffice();
  const id = String(formData.get("id") ?? "");
  try {
    await getStore().markShoppingBought(id, OFFICE_AUTHOR);
  } catch (error) {
    if (error instanceof Error && error.message === "missing") return;
    throw error;
  }
  refresh();
}

export async function deleteShoppingItem(formData: FormData) {
  await requireOffice();
  await getStore().deleteShopping(String(formData.get("id") ?? ""));
  refresh();
}

export async function deleteEntry(formData: FormData) {
  await requireOffice();
  await getStore().deleteEntry(String(formData.get("id") ?? ""));
  refresh();
}

export async function clearSamples() {
  await requireOffice();
  await getStore().deleteSamples();
  refresh();
}

function teamError(code: string): never {
  redirect(`/admin/team?error=${code}`);
}

export async function addStaffMember(formData: FormData) {
  await requireOffice();
  const name = cleanPersonName(String(formData.get("name") ?? ""));
  if (!name) teamError("empty");
  try {
    await getStore().createStaff(name);
  } catch (error) {
    if (error instanceof Error && error.message === "duplicate") teamError("duplicate");
    throw error;
  }
  refresh();
}

export async function renameStaffMember(formData: FormData) {
  await requireOffice();
  const name = cleanPersonName(String(formData.get("name") ?? ""));
  if (!name) teamError("empty");
  try {
    await getStore().renameStaff(String(formData.get("id") ?? ""), name);
  } catch (error) {
    if (error instanceof Error && error.message === "duplicate") teamError("duplicate");
    if (error instanceof Error && error.message === "missing") teamError("missing");
    throw error;
  }
  refresh();
}

export async function setStaffActive(formData: FormData) {
  await requireOffice();
  await getStore().setStaffActive(String(formData.get("id") ?? ""), formData.get("active") === "yes");
  refresh();
}

async function walkActor(source: string): Promise<{ name: string; staffId: string | null; office: boolean }> {
  if (source === "office") {
    if (!(await isAdmin())) redirect("/admin/login");
    return { name: OFFICE_AUTHOR, staffId: null, office: true };
  }
  const staff = await getCurrentStaff();
  if (!staff) redirect("/?needName=1");
  return { name: staff.name, staffId: staff.id, office: false };
}

function walkHome(office: boolean, day: string): string {
  return office ? `/admin/walks?day=${day}` : `/walks?day=${day}`;
}

export async function saveWalkDog(
  _previous: { error?: string },
  formData: FormData,
): Promise<{ error?: string }> {
  const actor = await walkActor(String(formData.get("source") ?? "yard"));
  const today = londonToday();
  const validated = validateWalkPlan(
    {
      dogName: String(formData.get("dogName") ?? ""),
      note: String(formData.get("note") ?? ""),
      dates: formData.getAll("walkDate").map(String),
    },
    today,
  );
  if (!validated.ok) return { error: validated.error };
  const id = String(formData.get("id") ?? "");
  const requested = clampWalkDay(String(formData.get("day") ?? ""), today);
  try {
    if (id) await getStore().updateWalkDog(id, validated.value);
    else await getStore().addWalkDog({ ...validated.value, createdByName: actor.name });
  } catch (error) {
    if (error instanceof Error && error.message === "missing") {
      return { error: "That dog is no longer on the plan." };
    }
    console.error(error);
    return { error: friendlySaveError(error) };
  }
  refresh();
  redirect(walkHome(actor.office, id ? requested : validated.value.dates[0]));
}

export async function removeWalkDog(formData: FormData) {
  const actor = await walkActor(String(formData.get("source") ?? "yard"));
  const day = clampWalkDay(String(formData.get("day") ?? ""), londonToday());
  await getStore().removeWalkDog(String(formData.get("id") ?? ""));
  refresh();
  redirect(walkHome(actor.office, day));
}

export async function markWalkDone(formData: FormData) {
  const actor = await walkActor(String(formData.get("source") ?? "yard"));
  try {
    await getStore().markWalkDone(String(formData.get("id") ?? ""), actor);
  } catch (error) {
    if (!(error instanceof Error && error.message === "missing")) throw error;
  }
  refresh();
}

export async function undoWalk(formData: FormData) {
  await walkActor(String(formData.get("source") ?? "yard"));
  try {
    await getStore().undoWalk(String(formData.get("id") ?? ""));
  } catch (error) {
    if (!(error instanceof Error && error.message === "missing")) throw error;
  }
  refresh();
}

async function stockActor(source: string): Promise<{ id: string | null; name: string }> {
  if (source === "office") {
    if (!(await isAdmin())) redirect("/admin/login");
    return { id: null, name: OFFICE_AUTHOR };
  }
  const staff = await getCurrentStaff();
  if (!staff) redirect("/?needName=1");
  return { id: staff.id, name: staff.name };
}

export async function addStockItem(formData: FormData) {
  const actor = await stockActor(String(formData.get("source") ?? "yard"));
  const named = validateStockName(String(formData.get("name") ?? ""));
  if (!named.ok) return;
  const quantity = parseStockQuantity(String(formData.get("quantity") ?? "0")) ?? 0;
  try {
    await getStore().addStock({ name: named.name, quantity, updatedBy: actor.id, updatedByName: actor.name });
  } catch (error) {
    if (error instanceof Error && error.message === "duplicate") return;
    throw error;
  }
  refresh();
}

export async function renameStockItem(formData: FormData) {
  if (!(await isAdmin())) redirect("/admin/login");
  const named = validateStockName(String(formData.get("name") ?? ""));
  if (!named.ok) return;
  try {
    await getStore().renameStock(String(formData.get("id") ?? ""), named.name, { id: null, name: OFFICE_AUTHOR });
  } catch (error) {
    if (error instanceof Error && (error.message === "duplicate" || error.message === "missing")) return;
    throw error;
  }
  refresh();
}

export async function deleteStockItem(formData: FormData) {
  if (!(await isAdmin())) redirect("/admin/login");
  await getStore().deleteStock(String(formData.get("id") ?? ""));
  refresh();
}

export async function adjustStock(formData: FormData) {
  const actor = await stockActor(String(formData.get("source") ?? "yard"));
  const delta = Number(formData.get("delta"));
  if (delta !== 0.5 && delta !== -0.5) return;
  try {
    await getStore().adjustStock(String(formData.get("id") ?? ""), delta, actor);
  } catch (error) {
    if (!(error instanceof Error && error.message === "missing")) throw error;
  }
  refresh();
}

export async function setStockStatus(formData: FormData) {
  const actor = await stockActor(String(formData.get("source") ?? "yard"));
  const status = String(formData.get("status") ?? "");
  if (!isStockStatus(status)) return;
  try {
    await getStore().setStockStatus(String(formData.get("id") ?? ""), status, actor);
  } catch (error) {
    if (!(error instanceof Error && error.message === "missing")) throw error;
  }
  refresh();
}

export async function setStockKennels(formData: FormData) {
  const actor = await stockActor(String(formData.get("source") ?? "yard"));
  try {
    await getStore().setStockKennels(
      String(formData.get("id") ?? ""),
      validateKennelsNote(String(formData.get("kennels") ?? "")),
      actor,
    );
  } catch (error) {
    if (!(error instanceof Error && error.message === "missing")) throw error;
  }
  refresh();
}

export async function moveStaffMember(formData: FormData) {
  await requireOffice();
  const direction = formData.get("direction") === "up" ? "up" : "down";
  await getStore().moveStaff(String(formData.get("id") ?? ""), direction);
  refresh();
}

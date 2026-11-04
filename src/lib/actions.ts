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

export async function moveStaffMember(formData: FormData) {
  await requireOffice();
  const direction = formData.get("direction") === "up" ? "up" : "down";
  await getStore().moveStaff(String(formData.get("id") ?? ""), direction);
  refresh();
}

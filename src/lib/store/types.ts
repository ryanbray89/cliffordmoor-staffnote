import type { JobLog } from "@/lib/job-schedule";
import type { StockItem, StockStatus } from "@/lib/stock";
import type { WalkDog } from "@/lib/walks";
import type { NewShoppingItem, ShoppingItem } from "@/lib/shopping";
import type { Entry, Filters, NewEntry, Staff } from "@/lib/types";

export type PhotoFile = {
  bytes: Buffer;
  contentType: string;
};

export type Store = {
  listStaff(options?: { includeInactive?: boolean }): Promise<Staff[]>;
  getStaff(id: string): Promise<Staff | null>;
  createStaff(name: string): Promise<Staff>;
  renameStaff(id: string, name: string): Promise<Staff>;
  setStaffActive(id: string, active: boolean): Promise<Staff>;
  moveStaff(id: string, direction: "up" | "down"): Promise<void>;
  createEntry(input: NewEntry): Promise<Entry>;
  listEntries(filters: Filters, limit?: number): Promise<Entry[]>;
  listJobLogs(): Promise<JobLog[]>;
  updateEntry(id: string, patch: { status?: Entry["status"]; charged?: boolean }): Promise<Entry>;
  addReply(entryId: string, authorName: string, body: string): Promise<Entry>;
  deleteEntry(id: string): Promise<void>;
  deleteSamples(): Promise<void>;
  countNew(): Promise<number>;
  countSample(): Promise<number>;
  getPhoto(entryId: string): Promise<PhotoFile | null>;
  listShopping(): Promise<ShoppingItem[]>;
  addShopping(input: NewShoppingItem): Promise<ShoppingItem>;
  markShoppingBought(id: string, boughtByName: string): Promise<ShoppingItem>;
  deleteShopping(id: string): Promise<void>;
  listWalkPlan(): Promise<WalkDog[]>;
  addWalkDog(input: { dogName: string; note: string | null; dates: string[]; createdByName: string }): Promise<WalkDog>;
  updateWalkDog(id: string, input: { dogName: string; note: string | null; dates: string[] }): Promise<WalkDog>;
  removeWalkDog(id: string): Promise<void>;
  markWalkDone(dayId: string, actor: { staffId: string | null; name: string }): Promise<void>;
  undoWalk(dayId: string): Promise<void>;
  listStock(): Promise<StockItem[]>;
  addStock(input: { name: string; quantity: number; updatedBy: string | null; updatedByName: string }): Promise<StockItem>;
  renameStock(id: string, name: string, actor: { id: string | null; name: string }): Promise<StockItem>;
  deleteStock(id: string): Promise<void>;
  adjustStock(id: string, delta: number, actor: { id: string | null; name: string }): Promise<StockItem>;
  setStockStatus(id: string, status: StockStatus, actor: { id: string | null; name: string }): Promise<StockItem>;
  setStockKennels(id: string, kennelsNote: string | null, actor: { id: string | null; name: string }): Promise<StockItem>;
};

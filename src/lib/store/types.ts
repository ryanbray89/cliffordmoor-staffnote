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
};

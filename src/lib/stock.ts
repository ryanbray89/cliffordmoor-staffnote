export type StockStatus = "ok" | "low" | "out";

export type StockItem = {
  id: string;
  name: string;
  quantity: number;
  kennelsNote: string | null;
  status: StockStatus;
  sortOrder: number;
  updatedBy: string | null;
  updatedByName: string;
  updatedAt: string;
  createdAt: string;
};

export const STOCK_SEED: Array<Pick<StockItem, "name" | "quantity" | "kennelsNote" | "status" | "sortOrder">> = [
  { name: "Wagg 12kg (in freezers)", quantity: 2, kennelsNote: "1", status: "ok", sortOrder: 1 },
  { name: "Harringtons 1.7kg bags (in freezers)", quantity: 2, kennelsNote: null, status: "ok", sortOrder: 2 },
  { name: "Cat dry food (in freezers)", quantity: 0, kennelsNote: "half bag", status: "out", sortOrder: 3 },
  { name: "Bleach (bottles)", quantity: 8, kennelsNote: null, status: "ok", sortOrder: 4 },
  { name: "Washing liquid", quantity: 11, kennelsNote: null, status: "ok", sortOrder: 5 },
  { name: "Vira care", quantity: 11, kennelsNote: null, status: "ok", sortOrder: 6 },
  { name: "Bacta care", quantity: 12, kennelsNote: null, status: "ok", sortOrder: 7 },
  { name: "Cat litter", quantity: 3, kennelsNote: "1", status: "ok", sortOrder: 8 },
  { name: "Cat wet food (boxes of 6 cans)", quantity: 4, kennelsNote: null, status: "ok", sortOrder: 9 },
  { name: "Dog wet food (boxes)", quantity: 0, kennelsNote: "1.5 boxes", status: "out", sortOrder: 10 },
  { name: "Kitchen roll (rolls)", quantity: 15, kennelsNote: null, status: "ok", sortOrder: 11 },
  { name: "Loo roll", quantity: 0, kennelsNote: null, status: "out", sortOrder: 12 },
  { name: "Washing powder (boxes)", quantity: 3, kennelsNote: null, status: "ok", sortOrder: 13 },
  { name: "Bin bags (large rolls)", quantity: 2, kennelsNote: null, status: "ok", sortOrder: 14 },
  { name: "Whiteboard markers", quantity: 3, kennelsNote: null, status: "ok", sortOrder: 15 },
  { name: "Disposable gloves (boxes)", quantity: 1, kennelsNote: null, status: "low", sortOrder: 16 },
  { name: "Plasters (boxes)", quantity: 4, kennelsNote: null, status: "ok", sortOrder: 17 },
  { name: "Hand wash", quantity: 4, kennelsNote: null, status: "ok", sortOrder: 18 },
  { name: "Blue cloths (packets)", quantity: 0.5, kennelsNote: null, status: "low", sortOrder: 19 },
];

const STATUS_RANK: Record<StockStatus, number> = { out: 0, low: 1, ok: 2 };

function line(value: string, max: number): string {
  return value.replace(/\s+/g, " ").trim().slice(0, max);
}

export function roundStockQuantity(value: number): number {
  return Math.round(value * 10) / 10;
}

export function formatStockQuantity(value: number): string {
  const rounded = roundStockQuantity(value);
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
}

export function stepStockQuantity(current: number, delta: number): number {
  return Math.min(9999, Math.max(0, roundStockQuantity(current + delta)));
}

export function sortStockItems(items: StockItem[]): StockItem[] {
  return [...items].sort(
    (a, b) => STATUS_RANK[a.status] - STATUS_RANK[b.status] || a.sortOrder - b.sortOrder || a.name.localeCompare(b.name, "en-GB"),
  );
}

export function isStockStatus(value: string): value is StockStatus {
  return value === "ok" || value === "low" || value === "out";
}

export function validateStockName(value: string): { ok: true; name: string } | { ok: false; error: string } {
  const name = line(value, 80);
  if (!name) return { ok: false, error: "Say what the item is." };
  return { ok: true, name };
}

export function validateKennelsNote(value: string): string | null {
  const note = line(value, 80);
  return note.length > 0 ? note : null;
}

export function seedStockItems(now = "2026-11-10T08:00:00.000Z"): StockItem[] {
  return STOCK_SEED.map((row, index) => ({
    id: `stock-seed-${index + 1}`,
    name: row.name,
    quantity: row.quantity,
    kennelsNote: row.kennelsNote,
    status: row.status,
    sortOrder: row.sortOrder,
    updatedBy: null,
    updatedByName: "Stock take",
    updatedAt: now,
    createdAt: now,
  }));
}

export function parseStockQuantity(value: unknown): number | null {
  const number = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(number)) return null;
  const rounded = roundStockQuantity(number);
  if (rounded < 0 || rounded > 9999) return null;
  return rounded;
}

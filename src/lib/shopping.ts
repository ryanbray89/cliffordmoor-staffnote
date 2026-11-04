export type ShoppingStatus = "needed" | "bought";

export type ShoppingItem = {
  id: string;
  item: string;
  quantity: string | null;
  note: string | null;
  addedBy: string | null;
  addedByName: string;
  status: ShoppingStatus;
  boughtAt: string | null;
  boughtByName: string | null;
  createdAt: string;
};

export type NewShoppingItem = {
  item: string;
  quantity: string | null;
  note: string | null;
  addedBy: string | null;
  addedByName: string;
};

function line(value: string, max: number): string {
  return value.replace(/\s+/g, " ").trim().slice(0, max);
}

function prose(value: string, max: number): string {
  return value.replace(/\r\n/g, "\n").trim().slice(0, max);
}

export function sameItemName(left: string, right: string): boolean {
  return left.trim().toLowerCase() === right.trim().toLowerCase();
}

export function validateShopping(raw: {
  item: string;
  quantity: string;
  note: string;
}): { ok: true; value: Pick<NewShoppingItem, "item" | "quantity" | "note"> } | { ok: false; error: string } {
  const item = line(raw.item, 80);
  if (!item) return { ok: false, error: "Say what to buy." };
  const quantity = line(raw.quantity, 40);
  const note = prose(raw.note, 500);
  return {
    ok: true,
    value: {
      item,
      quantity: quantity.length > 0 ? quantity : null,
      note: note.length > 0 ? note : null,
    },
  };
}

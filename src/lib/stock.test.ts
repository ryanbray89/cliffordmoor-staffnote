import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { formatStockQuantity, sortStockItems, stepStockQuantity, validateKennelsNote, validateStockName, type StockItem } from "./stock";

function item(overrides: Partial<StockItem>): StockItem {
  return {
    id: overrides.name ?? "id",
    name: "Item",
    quantity: 1,
    kennelsNote: null,
    status: "ok",
    sortOrder: 1,
    updatedBy: null,
    updatedByName: "Stock take",
    updatedAt: "2026-11-10T12:00:00.000Z",
    createdAt: "2026-11-10T12:00:00.000Z",
    ...overrides,
  };
}

describe("stock", () => {
  it("steps quantity in halves and does not go below zero", () => {
    assert.equal(stepStockQuantity(1, -0.5), 0.5);
    assert.equal(stepStockQuantity(0.5, -0.5), 0);
    assert.equal(stepStockQuantity(0, -0.5), 0);
    assert.equal(stepStockQuantity(11, 0.5), 11.5);
    assert.equal(formatStockQuantity(2), "2");
    assert.equal(formatStockQuantity(0.5), "0.5");
  });

  it("lists out, then low, then ok", () => {
    const names = sortStockItems([
      item({ name: "Bleach", status: "ok", sortOrder: 1 }),
      item({ name: "Gloves", status: "low", sortOrder: 2 }),
      item({ name: "Loo roll", status: "out", sortOrder: 3 }),
      item({ name: "Cat food", status: "out", sortOrder: 1 }),
    ]).map((row) => row.name);
    assert.deepEqual(names, ["Cat food", "Loo roll", "Gloves", "Bleach"]);
  });

  it("trims a name and an optional kennels note", () => {
    const name = validateStockName("  Blue cloths  ");
    assert.equal(name.ok && name.name, "Blue cloths");
    assert.equal(validateStockName("   ").ok, false);
    assert.equal(validateKennelsNote("  half bag "), "half bag");
    assert.equal(validateKennelsNote("   "), null);
  });
});

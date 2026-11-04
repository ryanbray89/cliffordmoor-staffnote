import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { amazonSearchUrl, sameItemName, validateShopping } from "./shopping";

describe("validateShopping", () => {
  it("keeps a name and an optional quantity and note", () => {
    const result = validateShopping({
      item: "  Poop bags  ",
      quantity: " 2 boxes ",
      note: " The blue ones ",
    });
    assert.equal(result.ok, true);
    if (result.ok) {
      assert.equal(result.value.item, "Poop bags");
      assert.equal(result.value.quantity, "2 boxes");
      assert.equal(result.value.note, "The blue ones");
    }
  });

  it("asks for the item and drops a blank quantity", () => {
    assert.deepEqual(validateShopping({ item: "   ", quantity: "", note: "" }), {
      ok: false,
      error: "Say what to buy.",
    });
    const result = validateShopping({ item: "Milk", quantity: "  ", note: "" });
    assert.equal(result.ok, true);
    if (result.ok) {
      assert.equal(result.value.quantity, null);
      assert.equal(result.value.note, null);
    }
  });

  it("builds an Amazon search from the item and the quantity", () => {
    assert.equal(
      amazonSearchUrl("Poop bags", "2 boxes"),
      "https://www.amazon.co.uk/s?k=Poop%20bags%202%20boxes",
    );
    assert.equal(amazonSearchUrl("Milk", "   "), "https://www.amazon.co.uk/s?k=Milk");
    assert.equal(amazonSearchUrl("Milk", null), "https://www.amazon.co.uk/s?k=Milk");
    assert.equal(
      amazonSearchUrl("Bleach & cloths", "1"),
      "https://www.amazon.co.uk/s?k=Bleach%20%26%20cloths%201",
    );
  });

  it("matches names without worrying about case", () => {
    assert.equal(sameItemName(" Poop bags ", "poop bags"), true);
    assert.equal(sameItemName("Milk", "Biscuits"), false);
  });
});

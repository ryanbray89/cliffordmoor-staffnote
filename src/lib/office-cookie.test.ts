import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { signOfficeToken, verifyOfficeToken } from "./office-cookie";

describe("office cookie", () => {
  it("accepts a token it just signed", async () => {
    const token = await signOfficeToken("2468", Date.now() + 60_000);
    assert.equal(await verifyOfficeToken("2468", token), true);
  });

  it("rejects the wrong PIN, a tampered token, and an expired one", async () => {
    const token = await signOfficeToken("2468", Date.now() + 60_000);
    assert.equal(await verifyOfficeToken("9999", token), false);
    assert.equal(await verifyOfficeToken("2468", `${token}x`), false);
    const expired = await signOfficeToken("2468", Date.now() - 1_000);
    assert.equal(await verifyOfficeToken("2468", expired), false);
    assert.equal(await verifyOfficeToken("2468", undefined), false);
  });
});
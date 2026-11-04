import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { validateEntry, type RawEntry } from "./validate";

const today = "2026-11-02";

function raw(overrides: Partial<RawEntry> = {}): RawEntry {
  return {
    type: "extra_dog_work",
    title: "Bath",
    detail: "",
    dogName: "Bramble",
    ownerName: "",
    kennel: "12",
    area: "",
    jobState: "",
    quantity: "1",
    durationMins: "30",
    urgent: false,
    happenedOn: today,
    ...overrides,
  };
}

describe("validateEntry", () => {
  it("accepts a bath", () => {
    const result = validateEntry(raw(), { today });
    assert.equal(result.ok, true);
    if (result.ok) {
      assert.equal(result.value.dogName, "Bramble");
      assert.equal(result.value.durationMins, 30);
      assert.equal(result.value.quantity, 1);
    }
  });

  it("asks for the dog", () => {
    const result = validateEntry(raw({ dogName: "  " }), { today });
    assert.deepEqual(result, { ok: false, error: "Add the dog's name." });
  });

  it("rejects a future date and a date older than a fortnight", () => {
    assert.equal(validateEntry(raw({ happenedOn: "2026-11-03" }), { today }).ok, false);
    assert.equal(validateEntry(raw({ happenedOn: "2026-10-01" }), { today }).ok, false);
  });

  it("requires the note text and the job state", () => {
    const note = validateEntry(raw({ type: "note", title: "Issue", detail: "", dogName: "" }), { today });
    assert.equal(note.ok, false);
    const job = validateEntry(
      raw({ type: "extra_job", title: "Laundry", dogName: "", jobState: "" }),
      { today },
    );
    assert.equal(job.ok, false);
    const done = validateEntry(
      raw({ type: "extra_job", title: "Laundry", dogName: "Bramble", jobState: "done", quantity: "", durationMins: "" }),
      { today },
    );
    assert.equal(done.ok, true);
    if (done.ok) assert.equal(done.value.dogName, null);
  });
});

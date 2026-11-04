import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { JOB_TASKS, WALK_TITLE } from "./catalog";
import { shiftCivilDate } from "./time";
import { validateEntry, type RawEntry } from "./validate";

const today = "2026-11-02";

function raw(overrides: Partial<RawEntry> = {}): RawEntry {
  return {
    type: "extra_dog_work",
    title: "",
    detail: "",
    dogName: "Bramble",
    ownerName: "",
    kennel: "12",
    area: "",
    jobState: "",
    jobTasks: [],
    jobOther: "",
    walkDates: [today],
    urgent: false,
    happenedOn: today,
    ...overrides,
  };
}

describe("validateEntry", () => {
  it("accepts an extra walk and forces 30 minutes", () => {
    const result = validateEntry(
      raw({ walkDates: ["2026-11-04", "2026-11-02", "2026-11-02"], title: "Bath" }),
      { today },
    );
    assert.equal(result.ok, true);
    if (result.ok) {
      assert.equal(result.value.dogName, "Bramble");
      assert.equal(result.value.title, WALK_TITLE);
      assert.equal(result.value.durationMins, 30);
      assert.equal(result.value.quantity, 2);
      assert.deepEqual(result.value.walkDates, ["2026-11-02", "2026-11-04"]);
    }
  });

  it("asks for the dog and for at least one day", () => {
    const missingDog = validateEntry(raw({ dogName: "  " }), { today });
    assert.deepEqual(missingDog, { ok: false, error: "Add the dog's name." });
    const missingDays = validateEntry(raw({ walkDates: [] }), { today });
    assert.deepEqual(missingDays, { ok: false, error: "Choose the days to walk." });
  });

  it("keeps walk days inside the last 30 days and the next 60", () => {
    const earliest = shiftCivilDate(today, -30);
    const latest = shiftCivilDate(today, 60);
    assert.equal(validateEntry(raw({ walkDates: [earliest, latest] }), { today }).ok, true);
    assert.equal(validateEntry(raw({ walkDates: [shiftCivilDate(today, -31)] }), { today }).ok, false);
    assert.equal(validateEntry(raw({ walkDates: [shiftCivilDate(today, 61)] }), { today }).ok, false);
    const tooMany = Array.from({ length: 21 }, (_, index) => shiftCivilDate(today, index));
    const over = validateEntry(raw({ walkDates: tooMany }), { today });
    assert.deepEqual(over, { ok: false, error: "You can pick up to 20 days." });
  });

  it("rejects a future log date and a log date older than a fortnight", () => {
    assert.equal(validateEntry(raw({ happenedOn: "2026-11-03" }), { today }).ok, false);
    assert.equal(validateEntry(raw({ happenedOn: "2026-10-01" }), { today }).ok, false);
  });

  it("requires the note text and builds a job from the new list", () => {
    const note = validateEntry(
      raw({ type: "note", title: "Issue", detail: "", dogName: "", walkDates: [] }),
      { today },
    );
    assert.equal(note.ok, false);
    const job = validateEntry(
      raw({ type: "extra_job", title: "Laundry", dogName: "", jobState: "", walkDates: [] }),
      { today },
    );
    assert.equal(job.ok, false);
    const done = validateEntry(
      raw({
        type: "extra_job",
        title: "Laundry",
        dogName: "Bramble",
        jobState: "done",
        jobTasks: ["Fridge", "Outside walls", "Not a real job"],
        jobOther: "  Fix the hose  ",
        walkDates: ["2026-11-02"],
      }),
      { today },
    );
    assert.equal(done.ok, true);
    if (done.ok) {
      assert.equal(done.value.dogName, null);
      assert.equal(done.value.walkDates, null);
      assert.equal(done.value.quantity, null);
      assert.equal(done.value.durationMins, null);
      assert.equal(done.value.title, ["Outside walls", "Fridge", "Fix the hose"].join("\n"));
    }
    assert.equal(new Set<string>(JOB_TASKS).has("Muck out"), false);
    assert.equal(JOB_TASKS[0], "Outside walls");
    assert.equal(JOB_TASKS.at(-1), "Restock (dry/meat/litter/cleaning fluids)");
  });
});

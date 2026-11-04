import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { joinWalkPlan, normalizeWalkDogs, validateWalkPlan, walksOn, type WalkDayRecord, type WalkDogRecord } from "./walks";
import { shiftCivilDate } from "./time";

const today = "2026-11-04";

function dog(overrides: Partial<WalkDogRecord> = {}): WalkDogRecord {
  return {
    id: "dog-1",
    dogName: "Bramble",
    note: "Kennel 12",
    createdByName: "Jordanna",
    createdAt: "2026-11-04T10:00:00.000Z",
    active: true,
    ...overrides,
  };
}

function day(overrides: Partial<WalkDayRecord> = {}): WalkDayRecord {
  return {
    id: "day-1",
    walkDogId: "dog-1",
    walkDate: today,
    doneAt: null,
    doneBy: null,
    doneByName: null,
    ...overrides,
  };
}

describe("walk plan", () => {
  it("requires a name and at least one day inside the window", () => {
    assert.equal(validateWalkPlan({ dogName: "  ", note: "", dates: [today] }, today).ok, false);
    assert.equal(validateWalkPlan({ dogName: "Bramble", note: "", dates: [] }, today).ok, false);
    const tooFar = validateWalkPlan({ dogName: "Bramble", note: "", dates: [shiftCivilDate(today, 61)] }, today);
    assert.equal(tooFar.ok, false);
    const ok = validateWalkPlan(
      { dogName: "  Bramble ", note: " Kennel 12 ", dates: ["2026-11-06", today, today] },
      today,
    );
    assert.equal(ok.ok, true);
    if (ok.ok) {
      assert.equal(ok.value.dogName, "Bramble");
      assert.equal(ok.value.note, "Kennel 12");
      assert.deepEqual(ok.value.dates, [today, "2026-11-06"]);
    }
  });

  it("lists outstanding walks before finished ones and keeps a walked inactive dog", () => {
    const dogs = joinWalkPlan(
      [dog(), dog({ id: "dog-2", dogName: "Mabel", active: false }), dog({ id: "dog-3", dogName: "Alfie" })],
      [
        day({ doneAt: "2026-11-04T15:00:00.000Z", doneByName: "Jordanna", doneBy: "staff" }),
        day({ id: "day-2", walkDogId: "dog-2", doneAt: "2026-11-04T14:00:00.000Z", doneByName: "Ryan" }),
        day({ id: "day-3", walkDogId: "dog-2", walkDate: "2026-11-05" }),
        day({ id: "day-4", walkDogId: "dog-3" }),
      ],
    );
    const todayRows = walksOn(dogs, today).map((row) => row.dog.dogName);
    assert.deepEqual(todayRows, ["Alfie", "Bramble", "Mabel"]);
    assert.deepEqual(
      walksOn(dogs, "2026-11-05").map((row) => row.dog.dogName),
      [],
    );
  });

  it("reads a book saved before the walk plan existed", () => {
    assert.deepEqual(normalizeWalkDogs(undefined), []);
    assert.equal(normalizeWalkDogs([{ id: "x" }]).length, 0);
  });
});

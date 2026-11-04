import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { formatCsvDate, londonHour, londonToday, shiftCivilDate } from "./time";

describe("London time", () => {
  it("uses British Summer Time after midnight UTC", () => {
    const instant = new Date("2026-07-15T23:30:00.000Z");
    assert.equal(londonToday(instant), "2026-07-16");
    assert.equal(londonHour(instant), 0);
  });

  it("stays on GMT in November", () => {
    const instant = new Date("2026-11-02T00:30:00.000Z");
    assert.equal(londonToday(instant), "2026-11-02");
    assert.equal(londonHour(instant), 0);
  });

  it("shifts civil dates across month ends", () => {
    assert.equal(shiftCivilDate("2026-03-01", -1), "2026-02-28");
    assert.equal(shiftCivilDate("2024-03-01", -1), "2024-02-29");
    assert.equal(shiftCivilDate("2026-11-02", -14), "2026-10-19");
  });

  it("formats dates for a UK spreadsheet", () => {
    assert.equal(formatCsvDate("2026-11-02"), "02/11/2026");
  });
});

import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { filtersToQuery, hasFilters, matchesFilters, parseFilters } from "./filters";
import type { Entry } from "./types";

function entry(overrides: Partial<Entry> = {}): Entry {
  return {
    id: "1",
    type: "extra_dog_work",
    staffId: "staff-1",
    staffName: "Jordanna",
    title: "Bath",
    detail: "",
    dogName: "Bramble",
    ownerName: null,
    kennel: "12",
    area: null,
    jobState: null,
    quantity: 1,
    durationMins: null,
    walkDates: null,
    urgent: false,
    happenedOn: "2026-11-02",
    status: "new",
    charged: false,
    sample: false,
    hasPhoto: false,
    createdAt: "2026-11-02T12:00:00.000Z",
    updatedAt: "2026-11-02T12:00:00.000Z",
    replies: [],
    ...overrides,
  };
}

describe("filters", () => {
  it("round-trips the query string", () => {
    const filters = parseFilters(
      new URLSearchParams("type=extra_dog_work&status=new&staff=staff-1&dog=Bram&from=2026-11-02&to=2026-11-01&charged=not_charged&needs=1"),
    );
    assert.equal(filters.from, "2026-11-01");
    assert.equal(filters.to, "2026-11-02");
    assert.equal(filters.charged, "not_charged");
    assert.equal(filters.needsDoing, true);
    const again = parseFilters(new URLSearchParams(filtersToQuery(filters)));
    assert.deepEqual(again, filters);
    assert.equal(hasFilters(filters), true);
  });

  it("ignores a nonsense type and an impossible date", () => {
    const filters = parseFilters(new URLSearchParams("type=cat&from=2026-02-31"));
    assert.equal(filters.type, "all");
    assert.equal(filters.from, "");
    assert.equal(hasFilters(filters), false);
  });

  it("matches dog, billing, and outstanding jobs", () => {
    const dog = entry();
    const job = entry({
      type: "extra_job",
      dogName: null,
      charged: null,
      jobState: "needs_doing",
      title: "Latch",
      quantity: null,
    });
    assert.equal(matchesFilters(dog, parseFilters(new URLSearchParams("dog=bram&charged=not_charged"))), true);
    assert.equal(matchesFilters(dog, parseFilters(new URLSearchParams("dog=mabel"))), false);
    assert.equal(matchesFilters(job, parseFilters(new URLSearchParams("needs=1"))), true);
    assert.equal(matchesFilters(dog, parseFilters(new URLSearchParams("needs=1"))), false);
  });
});

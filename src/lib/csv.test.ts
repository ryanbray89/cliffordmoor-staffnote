import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { toCsv } from "./csv";
import type { Entry } from "./types";

function entry(overrides: Partial<Entry> = {}): Entry {
  return {
    id: "33333333-3333-4333-8333-333333333302",
    type: "extra_dog_work",
    staffId: "22222222-2222-4222-8222-222222222222",
    staffName: "Jordanna",
    title: "Bath",
    detail: 'Said "lovely", then shook',
    dogName: "Bramble",
    ownerName: "Hale",
    kennel: "12",
    area: null,
    jobState: null,
    quantity: 2,
    durationMins: 30,
    walkDates: ["2026-11-02", "2026-11-03"],
    urgent: false,
    happenedOn: "2026-11-02",
    status: "new",
    charged: false,
    sample: false,
    hasPhoto: false,
    createdAt: "2026-11-02T14:05:00.000Z",
    updatedAt: "2026-11-02T14:05:00.000Z",
    replies: [
      {
        id: "44444444-4444-4444-8444-444444444401",
        entryId: "33333333-3333-4333-8333-333333333302",
        authorName: "Ryan",
        body: "Charge the bath",
        createdAt: "2026-11-02T15:00:00.000Z",
      },
    ],
    ...overrides,
  };
}

describe("CSV export", () => {
  it("starts with a BOM and escapes quotes", () => {
    const csv = toCsv([entry()]);
    assert.ok(csv.startsWith("\uFEFFDate,Logged at,Type"));
    assert.match(csv, /"Said ""lovely"", then shook"/);
    assert.match(csv, /Extra walk/);
    assert.match(csv, /Quantity,Walk days,Minutes/);
    assert.match(csv, /02\/11\/2026; 03\/11\/2026/);
    assert.match(csv, /02\/11\/2026/);
    assert.match(csv, /Ryan: Charge the bath/);
    assert.match(csv, /,No,/);
  });

  it("leaves charged blank for notes", () => {
    const csv = toCsv([
      entry({
        type: "note",
        title: "Maintenance",
        dogName: null,
        ownerName: null,
        kennel: null,
        quantity: null,
        durationMins: null,
        walkDates: null,
        charged: null,
        replies: [],
        detail: "Heater off",
      }),
    ]);
    assert.match(csv, /Note for Ryan/);
    const line = csv.trim().split("\r\n")[1];
    assert.ok(line?.endsWith(","));
  });
});

import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { after, before, describe, it } from "node:test";

import { EMPTY_FILTERS } from "../filters";
import { SEED_IDS } from "../seed";
import { londonToday } from "../time";
import { createLocalStore } from "./local";

describe("local store", () => {
  let dir = "";

  before(async () => {
    dir = await mkdtemp(path.join(tmpdir(), "staff-note-"));
  });

  after(async () => {
    if (dir) await rm(dir, { recursive: true, force: true });
  });

  it("seeds the team and sample logs", async () => {
    const store = createLocalStore(dir);
    const staff = await store.listStaff();
    assert.deepEqual(
      staff.map((person) => person.name),
      ["Ryan", "Jordanna"],
    );
    const entries = await store.listEntries(EMPTY_FILTERS);
    assert.equal(entries.length, 7);
    assert.equal(await store.countNew(), 4);
    const thanks = entries.find((entry) => entry.id === SEED_IDS.thanks);
    assert.equal(thanks?.replies[0]?.body, "Lovely. I'll mention it when they collect.");
  });

  it("logs dog work, replies, and billing", async () => {
    const store = createLocalStore(dir);
    const created = await store.createEntry({
      type: "extra_dog_work",
      staffId: SEED_IDS.jordanna,
      staffName: "Jordanna",
      title: "Nail trim",
      detail: "Front nails.",
      dogName: "Pip",
      ownerName: null,
      kennel: "3",
      area: null,
      jobState: null,
      quantity: 1,
      durationMins: 15,
      urgent: false,
      happenedOn: londonToday(),
      photo: {
        bytes: Buffer.from([0xff, 0xd8, 0xff, 0x00, 0x01]),
        contentType: "image/jpeg",
        ext: "jpg",
      },
    });
    assert.equal(created.status, "new");
    assert.equal(created.charged, false);
    assert.equal(created.hasPhoto, true);
    const photo = await store.getPhoto(created.id);
    assert.equal(photo?.contentType, "image/jpeg");

    const replied = await store.addReply(created.id, "Ryan", "Add it to the bill.");
    assert.equal(replied.status, "seen");
    assert.equal(replied.replies.at(-1)?.body, "Add it to the bill.");

    const charged = await store.updateEntry(created.id, { charged: true, status: "done" });
    assert.equal(charged.charged, true);
    assert.equal(charged.status, "done");

    const found = await store.listEntries({ ...EMPTY_FILTERS, dog: "pip", charged: "charged" });
    assert.equal(found.length, 1);

    await store.deleteEntry(created.id);
    assert.equal(await store.getPhoto(created.id), null);
  });

  it("hides a name without losing the log", async () => {
    const store = createLocalStore(dir);
    const added = await store.createStaff("Sam");
    await store.setStaffActive(added.id, false);
    const yard = await store.listStaff();
    assert.equal(
      yard.some((person) => person.name === "Sam"),
      false,
    );
    const all = await store.listStaff({ includeInactive: true });
    assert.equal(all.some((person) => person.id === added.id), true);
    await assert.rejects(() => store.createStaff("sam"), /duplicate/);
  });

  it("clears sample logs only", async () => {
    const store = createLocalStore(dir);
    const kept = await store.createEntry({
      type: "note",
      staffId: SEED_IDS.ryan,
      staffName: "Ryan",
      title: "Issue",
      detail: "Real note",
      dogName: null,
      ownerName: null,
      kennel: null,
      area: null,
      jobState: null,
      quantity: null,
      durationMins: null,
      urgent: true,
      happenedOn: londonToday(),
      photo: null,
    });
    await store.deleteSamples();
    assert.equal(await store.countSample(), 0);
    const left = await store.listEntries(EMPTY_FILTERS);
    assert.equal(left.some((entry) => entry.id === kept.id), true);
    assert.equal(left.some((entry) => entry.sample), false);
  });
});

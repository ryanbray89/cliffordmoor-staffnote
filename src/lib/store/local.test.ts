import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
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
    const walk = entries.find((entry) => entry.id === SEED_IDS.walk);
    assert.equal(walk?.durationMins, 30);
    assert.equal(walk?.quantity, 2);
    assert.deepEqual(walk?.walkDates?.length, 2);
    const thanks = entries.find((entry) => entry.id === SEED_IDS.thanks);
    assert.equal(thanks?.replies[0]?.body, "Lovely. I'll mention it when they collect.");
  });

  it("logs dog work, replies, and billing", async () => {
    const store = createLocalStore(dir);
    const created = await store.createEntry({
      type: "extra_dog_work",
      staffId: SEED_IDS.jordanna,
      staffName: "Jordanna",
      title: "Extra walk",
      detail: "Front field.",
      dogName: "Pip",
      ownerName: null,
      kennel: "3",
      area: null,
      jobState: null,
      quantity: 2,
      durationMins: 30,
      walkDates: ["2026-11-04", "2026-11-02"],
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
    assert.deepEqual(created.walkDates, ["2026-11-02", "2026-11-04"]);
    assert.equal(created.quantity, 2);
    assert.equal(created.durationMins, 30);
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
      walkDates: null,
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

  it("reads logs saved before walk days existed", async () => {
    const file = path.join(dir, "staff-note.json");
    const db = JSON.parse(await readFile(file, "utf8")) as { entries: Array<Record<string, unknown>> };
    const legacy = {
      id: "33333333-3333-4333-8333-333333333399",
      type: "extra_dog_work",
      staffId: SEED_IDS.jordanna,
      staffName: "Jordanna",
      title: "Bath",
      detail: "Old log",
      dogName: "Bramble",
      ownerName: null,
      kennel: "12",
      area: null,
      jobState: null,
      quantity: 1,
      durationMins: 30,
      urgent: false,
      happenedOn: "2026-11-02",
      status: "new",
      charged: false,
      sample: false,
      photoPath: null,
      photoContentType: null,
      createdAt: "2026-11-02T12:00:00.000Z",
      updatedAt: "2026-11-02T12:00:00.000Z",
    };
    db.entries.push(legacy);
    await writeFile(file, JSON.stringify(db));
    const store = createLocalStore(dir);
    const found = (await store.listEntries(EMPTY_FILTERS)).find((entry) => entry.id === legacy.id);
    assert.equal(found?.title, "Bath");
    assert.equal(found?.walkDates, null);
    assert.equal(found?.quantity, 1);
  });

  it("keeps a shopping list and still opens a book from before it existed", async () => {
    const store = createLocalStore(dir);
    const added = await store.addShopping({
      item: "Poop bags",
      quantity: "2 boxes",
      note: null,
      addedBy: SEED_IDS.jordanna,
      addedByName: "Jordanna",
    });
    assert.equal(added.status, "needed");
    const open = await store.listShopping();
    assert.equal(open[0]?.item, "Poop bags");
    assert.equal(open[0]?.addedByName, "Jordanna");

    const bought = await store.markShoppingBought(added.id, "Ryan");
    assert.equal(bought.status, "bought");
    assert.equal(bought.boughtByName, "Ryan");
    assert.ok(bought.boughtAt);

    await store.deleteShopping(added.id);
    assert.equal((await store.listShopping()).some((item) => item.id === added.id), false);

    const file = path.join(dir, "staff-note.json");
    const db = JSON.parse(await readFile(file, "utf8")) as { shopping?: unknown };
    delete db.shopping;
    await writeFile(file, JSON.stringify(db));
    assert.deepEqual(await store.listShopping(), []);
  });

  it("plans walks, marks one done, and still opens an older book", async () => {
    const store = createLocalStore(dir);
    const created = await store.addWalkDog({
      dogName: "Bramble",
      note: "Kennel 12",
      dates: ["2026-11-04", "2026-11-05"],
      createdByName: "Jordanna",
    });
    assert.equal(created.days.length, 2);
    const today = created.days.find((day) => day.walkDate === "2026-11-04");
    assert.ok(today);
    await store.markWalkDone(today.id, { staffId: SEED_IDS.jordanna, name: "Jordanna" });
    const updated = await store.updateWalkDog(created.id, {
      dogName: "Bramble",
      note: "Kennel 12",
      dates: ["2026-11-04"],
    });
    assert.deepEqual(updated.days.map((day) => day.walkDate), ["2026-11-04"]);
    assert.equal(updated.days[0]?.doneByName, "Jordanna");
    await store.undoWalk(updated.days[0].id);
    const cleared = (await store.listWalkPlan()).find((dog) => dog.id === created.id);
    assert.equal(cleared?.days[0]?.doneAt, null);
    await store.removeWalkDog(created.id);
    assert.equal((await store.listWalkPlan()).find((dog) => dog.id === created.id)?.active, false);

    const file = path.join(dir, "staff-note.json");
    const db = JSON.parse(await readFile(file, "utf8")) as { walkDogs?: unknown; walkDays?: unknown };
    delete db.walkDogs;
    delete db.walkDays;
    await writeFile(file, JSON.stringify(db));
    assert.deepEqual(await store.listWalkPlan(), []);
  });

  it("updates stock without adding a shopping item", async () => {
    const store = createLocalStore(dir);
    const shoppingBefore = (await store.listShopping()).length;
    const gloves = (await store.listStock()).find((item) => item.name === "Disposable gloves (boxes)");
    assert.equal(gloves?.status, "low");
    assert.ok(gloves);
    await store.setStockStatus(gloves.id, "out", { id: null, name: "Jordanna" });
    await store.adjustStock(gloves.id, -0.5, { id: null, name: "Jordanna" });
    const updated = (await store.listStock()).find((item) => item.id === gloves.id);
    assert.equal(updated?.status, "out");
    assert.equal(updated?.quantity, 0.5);
    assert.equal(updated?.updatedByName, "Jordanna");
    assert.equal((await store.listShopping()).length, shoppingBefore);
    const first = (await store.listStock())[0];
    assert.equal(first?.status, "out");
  });
});

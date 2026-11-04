import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { jobBoard, staffJobStatus, type JobLog } from "./job-schedule";
import { londonToday } from "./time";

function row(task: string, logs: JobLog[], now: Date | string) {
  const instant = typeof now === "string" ? new Date(`${now}T12:00:00.000Z`) : now;
  const found = jobBoard(logs, instant).find((item) => item.task === task);
  assert.ok(found);
  return found;
}

describe("job schedule", () => {
  it("treats a daily job as due from the next London day", () => {
    const logs: JobLog[] = [
      {
        title: "Tidy back room (sweep/mop/shelves/recycling)",
        staffName: "Jordanna",
        happenedOn: "2026-11-04",
        createdAt: "2026-11-04T15:00:00.000Z",
      },
    ];
    const sameDay = row("Tidy back room (sweep/mop/shelves/recycling)", logs, "2026-11-04");
    assert.equal(sameDay.status, "ok");
    assert.equal(sameDay.dueOn, "2026-11-05");
    assert.equal(row("Tidy back room (sweep/mop/shelves/recycling)", logs, "2026-11-05").status, "due");
    assert.equal(row("Tidy back room (sweep/mop/shelves/recycling)", logs, "2026-11-06").status, "overdue");
  });

  it("uses 7, 14, and 3 day intervals", () => {
    const logs: JobLog[] = [
      { title: "Fridge", staffName: "Ryan", happenedOn: "2026-11-01", createdAt: "2026-11-01T09:00:00.000Z" },
      { title: "Outside walls", staffName: "Ryan", happenedOn: "2026-10-21", createdAt: "2026-10-21T09:00:00.000Z" },
      { title: "Clean sink and tiles", staffName: "Ryan", happenedOn: "2026-11-01", createdAt: "2026-11-01T09:00:00.000Z" },
    ];
    assert.equal(row("Fridge", logs, "2026-11-07").status, "ok");
    assert.equal(row("Fridge", logs, "2026-11-08").status, "due");
    assert.equal(row("Fridge", logs, "2026-11-09").status, "overdue");
    assert.equal(row("Outside walls", logs, "2026-11-04").status, "due");
    assert.equal(row("Outside walls", logs, "2026-11-03").status, "ok");
    assert.equal(row("Clean sink and tiles", logs, "2026-11-03").status, "ok");
    assert.equal(row("Clean sink and tiles", logs, "2026-11-04").status, "due");
    assert.equal(row("Clean sink and tiles", logs, "2026-11-05").status, "overdue");
  });

  it("adds one calendar month, including short February", () => {
    const logs: JobLog[] = [
      { title: "Hutches/hutch shed", staffName: "Ryan", happenedOn: "2026-01-31", createdAt: "2026-01-31T09:00:00.000Z" },
    ];
    const before = row("Hutches/hutch shed", logs, "2026-02-27");
    assert.equal(before.status, "ok");
    assert.equal(before.dueOn, "2026-02-28");
    assert.equal(row("Hutches/hutch shed", logs, "2026-02-28").status, "due");
    assert.equal(row("Hutches/hutch shed", logs, "2026-03-01").status, "overdue");

    const leap: JobLog[] = [
      { title: "Hutches/hutch shed", staffName: "Ryan", happenedOn: "2024-01-31", createdAt: "2024-01-31T09:00:00.000Z" },
    ];
    assert.equal(row("Hutches/hutch shed", leap, "2024-02-29").dueOn, "2024-02-29");
  });

  it("marks a job that has never been logged as due", () => {
    const found = row("Cupboards", [], "2026-11-04");
    assert.equal(found.status, "due");
    assert.equal(found.lastDoneBy, null);
    assert.equal(staffJobStatus([], new Date("2026-11-04T12:00:00.000Z")).Cupboards.detail, "Due");
  });

  it("keeps the latest log when several people have done the job", () => {
    const logs: JobLog[] = [
      { title: "Fridge", staffName: "Ryan", happenedOn: "2026-11-01", createdAt: "2026-11-01T10:00:00.000Z" },
      { title: "Fridge\nCupboards", staffName: "Jordanna", happenedOn: "2026-11-04", createdAt: "2026-11-04T09:00:00.000Z" },
      { title: "Fridge", staffName: "Sam", happenedOn: "2026-11-04", createdAt: "2026-11-04T08:00:00.000Z" },
      { title: "Laundry", staffName: "Ryan", happenedOn: "2026-11-04", createdAt: "2026-11-04T12:00:00.000Z" },
    ];
    const fridge = row("Fridge", logs, "2026-11-04");
    assert.equal(fridge.lastDoneBy, "Jordanna");
    assert.equal(fridge.status, "ok");
    assert.equal(fridge.dueOn, "2026-11-11");
    const chip = staffJobStatus(logs, new Date("2026-11-04T12:00:00.000Z")).Fridge;
    assert.equal(chip.due, false);
    assert.equal(chip.detail, "Done today by Jordanna · due Wed 11 Nov");
  });

  it("hides heater season on the London date, including across midnight UTC", () => {
    const mayEve = new Date("2026-04-30T23:30:00.000Z");
    assert.equal(londonToday(mayEve), "2026-05-01");
    assert.equal(row("Wipe heaters", [], mayEve).status, "out_of_season");
    assert.equal(staffJobStatus([], mayEve)["Wipe heaters"].detail, "Not in season");
    assert.equal(staffJobStatus([], mayEve)["Wipe heaters"].due, false);

    const octoberEve = new Date("2026-09-30T23:30:00.000Z");
    assert.equal(londonToday(octoberEve), "2026-10-01");
    assert.equal(row("Wipe heaters", [], octoberEve).status, "due");

    const winterLogs: JobLog[] = [
      { title: "Wipe heaters", staffName: "Ryan", happenedOn: "2026-11-01", createdAt: "2026-11-01T10:00:00.000Z" },
    ];
    const winterMorning = new Date("2026-11-04T00:30:00.000Z");
    assert.equal(londonToday(winterMorning), "2026-11-04");
    assert.equal(row("Wipe heaters", winterLogs, winterMorning).status, "ok");
    assert.equal(row("Wipe heaters", winterLogs, new Date("2026-11-15T00:30:00.000Z")).status, "due");
  });
});

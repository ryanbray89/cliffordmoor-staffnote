import type { Entry, Reply, Staff } from "@/lib/types";
import { shiftCivilDate, londonToday } from "@/lib/time";

export const SEED_IDS = {
  ryan: "11111111-1111-4111-8111-111111111111",
  jordanna: "22222222-2222-4222-8222-222222222222",
  heater: "33333333-3333-4333-8333-333333333301",
  bath: "33333333-3333-4333-8333-333333333302",
  thanks: "33333333-3333-4333-8333-333333333303",
  meds: "33333333-3333-4333-8333-333333333304",
  latch: "33333333-3333-4333-8333-333333333305",
  walk: "33333333-3333-4333-8333-333333333306",
  laundry: "33333333-3333-4333-8333-333333333307",
  reply: "44444444-4444-4444-8444-444444444401",
} as const;

export type StoredEntry = Omit<Entry, "replies" | "hasPhoto"> & {
  photoPath: string | null;
  photoContentType: string | null;
};

export type Database = {
  staff: Staff[];
  entries: StoredEntry[];
  replies: Reply[];
};

function ago(now: Date, minutes: number): string {
  return new Date(now.getTime() - minutes * 60_000).toISOString();
}

function stored(entry: Omit<StoredEntry, "photoPath" | "photoContentType" | "sample"> & { sample?: boolean }): StoredEntry {
  return {
    ...entry,
    sample: entry.sample ?? true,
    photoPath: null,
    photoContentType: null,
  };
}

export function buildSeed(now = new Date()): Database {
  const today = londonToday(now);
  const yesterday = shiftCivilDate(today, -1);
  const staffCreated = "2024-05-13T08:00:00.000Z";

  const staff: Staff[] = [
    {
      id: SEED_IDS.ryan,
      name: "Ryan",
      active: true,
      sortOrder: 0,
      createdAt: staffCreated,
    },
    {
      id: SEED_IDS.jordanna,
      name: "Jordanna",
      active: true,
      sortOrder: 1,
      createdAt: staffCreated,
    },
  ];

  const entries: StoredEntry[] = [
    stored({
      id: SEED_IDS.heater,
      type: "note",
      staffId: SEED_IDS.ryan,
      staffName: "Ryan",
      title: "Maintenance",
      detail:
        "Heater in kennel 9 is not coming on. The dog has been moved to kennel 15 for tonight.",
      dogName: null,
      ownerName: null,
      kennel: null,
      area: null,
      jobState: null,
      quantity: null,
      durationMins: null,
      urgent: true,
      happenedOn: today,
      status: "new",
      charged: null,
      createdAt: ago(now, 10),
      updatedAt: ago(now, 10),
    }),
    stored({
      id: SEED_IDS.bath,
      type: "extra_dog_work",
      staffId: SEED_IDS.jordanna,
      staffName: "Jordanna",
      title: "Bath",
      detail: "Had a bath before collection this afternoon.",
      dogName: "Bramble",
      ownerName: "Hale",
      kennel: "12",
      area: null,
      jobState: null,
      quantity: 1,
      durationMins: 30,
      urgent: false,
      happenedOn: today,
      status: "new",
      charged: false,
      createdAt: ago(now, 25),
      updatedAt: ago(now, 25),
    }),
    stored({
      id: SEED_IDS.thanks,
      type: "note",
      staffId: SEED_IDS.jordanna,
      staffName: "Jordanna",
      title: "Customer comment",
      detail: "Mrs Hale said Bramble settled really well and asked us to pass on her thanks.",
      dogName: "Bramble",
      ownerName: null,
      kennel: null,
      area: null,
      jobState: null,
      quantity: null,
      durationMins: null,
      urgent: false,
      happenedOn: today,
      status: "seen",
      charged: null,
      createdAt: ago(now, 40),
      updatedAt: ago(now, 20),
    }),
    stored({
      id: SEED_IDS.meds,
      type: "extra_dog_work",
      staffId: SEED_IDS.ryan,
      staffName: "Ryan",
      title: "Medication",
      detail: "Morning tablet given, as on the chart.",
      dogName: "Alfie",
      ownerName: null,
      kennel: "4",
      area: null,
      jobState: null,
      quantity: 1,
      durationMins: null,
      urgent: false,
      happenedOn: today,
      status: "seen",
      charged: false,
      createdAt: ago(now, 120),
      updatedAt: ago(now, 90),
    }),
    stored({
      id: SEED_IDS.latch,
      type: "extra_job",
      staffId: SEED_IDS.ryan,
      staffName: "Ryan",
      title: "Mend paddock 2 gate latch",
      detail: "The latch is loose. Dogs are still secure, but it needs sorting today.",
      dogName: null,
      ownerName: null,
      kennel: null,
      area: "Paddocks",
      jobState: "needs_doing",
      quantity: null,
      durationMins: null,
      urgent: true,
      happenedOn: today,
      status: "new",
      charged: null,
      createdAt: ago(now, 180),
      updatedAt: ago(now, 180),
    }),
    stored({
      id: SEED_IDS.walk,
      type: "extra_dog_work",
      staffId: SEED_IDS.jordanna,
      staffName: "Jordanna",
      title: "Extra walk",
      detail: "Owner asked for an extra lunchtime walk.",
      dogName: "Mabel",
      ownerName: "Carter",
      kennel: "7",
      area: null,
      jobState: null,
      quantity: 1,
      durationMins: 20,
      urgent: false,
      happenedOn: yesterday,
      status: "new",
      charged: false,
      createdAt: ago(now, 26 * 60),
      updatedAt: ago(now, 26 * 60),
    }),
    stored({
      id: SEED_IDS.laundry,
      type: "extra_job",
      staffId: SEED_IDS.jordanna,
      staffName: "Jordanna",
      title: "Laundry",
      detail: "Kennel blankets through the wash.",
      dogName: null,
      ownerName: null,
      kennel: null,
      area: "Laundry",
      jobState: "done",
      quantity: null,
      durationMins: null,
      urgent: false,
      happenedOn: yesterday,
      status: "done",
      charged: null,
      createdAt: ago(now, 32 * 60),
      updatedAt: ago(now, 30 * 60),
    }),
  ];

  const replies: Reply[] = [
    {
      id: SEED_IDS.reply,
      entryId: SEED_IDS.thanks,
      authorName: "Ryan",
      body: "Lovely. I'll mention it when they collect.",
      createdAt: ago(now, 20),
    },
  ];

  return { staff, entries, replies };
}

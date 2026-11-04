export type EntryType = "extra_job" | "extra_dog_work" | "note";

export type EntryStatus = "new" | "seen" | "done";

export type JobState = "done" | "needs_doing";

export type Staff = {
  id: string;
  name: string;
  active: boolean;
  sortOrder: number;
  createdAt: string;
};

export type Reply = {
  id: string;
  entryId: string;
  authorName: string;
  body: string;
  createdAt: string;
};

export type Entry = {
  id: string;
  type: EntryType;
  staffId: string | null;
  staffName: string;
  title: string;
  detail: string;
  dogName: string | null;
  ownerName: string | null;
  kennel: string | null;
  area: string | null;
  jobState: JobState | null;
  quantity: number | null;
  durationMins: number | null;
  walkDates: string[] | null;
  urgent: boolean;
  happenedOn: string;
  status: EntryStatus;
  charged: boolean | null;
  sample: boolean;
  hasPhoto: boolean;
  createdAt: string;
  updatedAt: string;
  replies: Reply[];
};

export type NewEntry = {
  type: EntryType;
  staffId: string;
  staffName: string;
  title: string;
  detail: string;
  dogName: string | null;
  ownerName: string | null;
  kennel: string | null;
  area: string | null;
  jobState: JobState | null;
  quantity: number | null;
  durationMins: number | null;
  walkDates: string[] | null;
  urgent: boolean;
  happenedOn: string;
  photo: {
    bytes: Buffer;
    contentType: string;
    ext: string;
  } | null;
};

export type Filters = {
  type: "all" | EntryType;
  status: "all" | EntryStatus;
  staffId: string;
  dog: string;
  from: string;
  to: string;
  charged: "all" | "charged" | "not_charged";
  needsDoing: boolean;
};

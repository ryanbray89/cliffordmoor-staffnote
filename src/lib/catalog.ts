import type { EntryStatus, EntryType } from "@/lib/types";

export const MAX_PHOTO_BYTES = 5_000_000;

export const OFFICE_AUTHOR = "Ryan";

export const TYPE_LABEL: Record<EntryType, string> = {
  extra_job: "Extra job",
  extra_dog_work: "Extra dog work",
  note: "Note for Ryan",
};

export const STATUS_LABEL: Record<EntryStatus, string> = {
  new: "New",
  seen: "Seen",
  done: "Done",
};

export const JOB_SUGGESTIONS = [
  "Muck out",
  "Restock",
  "Deep clean",
  "Repair",
  "Laundry",
  "Bin run",
  "Fence check",
  "Bedding",
] as const;

export const AREAS = [
  "Kennel block",
  "Cattery",
  "Grooming room",
  "Paddocks",
  "Yard",
  "Laundry",
  "Office",
  "Shop",
] as const;

export const SERVICES = [
  "Extra walk",
  "Medication",
  "Bath",
  "Nail trim",
  "Brush",
  "Feed",
  "Play",
  "Other",
] as const;

export const NOTE_CATEGORIES = [
  "Issue",
  "Maintenance",
  "Customer comment",
  "Concern",
  "Supplies",
  "Other",
] as const;

export const DURATIONS = [10, 15, 20, 30, 45, 60] as const;

export const LOG_PATHS = {
  job: "/log/job",
  dog: "/log/dog",
  note: "/log/note",
} as const;

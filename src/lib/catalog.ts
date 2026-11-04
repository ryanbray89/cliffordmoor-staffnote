import type { EntryStatus, EntryType } from "@/lib/types";

export const MAX_PHOTO_BYTES = 5_000_000;

export const OFFICE_AUTHOR = "Ryan";

export const MAX_TITLE_LENGTH = 1000;

export const WALK_TITLE = "Extra walk";

export const WALK_MINUTES = 30;

export const MAX_WALK_DAYS = 20;

export const WALK_PAST_DAYS = 30;

export const WALK_FUTURE_DAYS = 60;

export const TYPE_LABEL: Record<EntryType, string> = {
  extra_job: "Extra job",
  extra_dog_work: "Extra walk",
  note: "Note for Ryan",
};

export const STATUS_LABEL: Record<EntryStatus, string> = {
  new: "New",
  seen: "Seen",
  done: "Done",
};

export const JOB_GROUPS = [
  [
    "Outside walls",
    "Inside walls and doors",
    "Paths (cattery, kennels, beds, scoops)",
    "Wipe/tidy",
    "Cupboards",
    "Fridge",
    "Scrub plastics outside walls/paths",
    "Vaccination cards",
    "Wipe heaters",
    "Cobwebs (not during shift)",
    "Clean sink and tiles",
    "Newspapers",
    "Clean food bins",
    "Tidy back room (sweep/mop/shelves/recycling)",
    "Set up kennels/catteries",
  ],
  [
    "Cattery under doors",
    "Sellotape on doors",
    "Hutches/hutch shed",
    "Change poo picker water",
    "Clean cat flaps",
    "Bleach or pressure wash paths",
  ],
  ["Restock (dry/meat/litter/cleaning fluids)"],
] as const;

export type JobTask = (typeof JOB_GROUPS)[number][number];

export const JOB_TASKS: readonly JobTask[] = JOB_GROUPS.flat();

export type JobEvery = "day" | "week" | "fortnight" | "month" | "twice-a-week";

export type JobRule = {
  every: JobEvery;
  season?: "october-april";
};

export const JOB_FREQUENCY = {
  "Outside walls": { every: "fortnight" },
  "Inside walls and doors": { every: "week" },
  "Paths (cattery, kennels, beds, scoops)": { every: "week" },
  "Wipe/tidy": { every: "week" },
  Cupboards: { every: "week" },
  Fridge: { every: "week" },
  "Scrub plastics outside walls/paths": { every: "week" },
  "Vaccination cards": { every: "week" },
  "Wipe heaters": { every: "fortnight", season: "october-april" },
  "Cobwebs (not during shift)": { every: "fortnight" },
  "Clean sink and tiles": { every: "twice-a-week" },
  Newspapers: { every: "fortnight" },
  "Clean food bins": { every: "week" },
  "Tidy back room (sweep/mop/shelves/recycling)": { every: "day" },
  "Set up kennels/catteries": { every: "day" },
  "Cattery under doors": { every: "week" },
  "Sellotape on doors": { every: "week" },
  "Hutches/hutch shed": { every: "month" },
  "Change poo picker water": { every: "week" },
  "Clean cat flaps": { every: "fortnight" },
  "Bleach or pressure wash paths": { every: "month" },
  "Restock (dry/meat/litter/cleaning fluids)": { every: "day" },
} satisfies Record<JobTask, JobRule>;

const JOB_RULES: Record<JobTask, JobRule> = JOB_FREQUENCY;

export function jobFrequencyLabel(task: JobTask): string {
  const rule = JOB_RULES[task];
  if (rule.season === "october-april") return "Fortnightly, October to April";
  if (rule.every === "day") return "Daily";
  if (rule.every === "week") return "Weekly";
  if (rule.every === "fortnight") return "Fortnightly";
  if (rule.every === "month") return "Monthly";
  return "Twice a week";
}

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

export const NOTE_CATEGORIES = [
  "Issue",
  "Maintenance",
  "Customer comment",
  "Concern",
  "Supplies",
  "Other",
] as const;

export const LOG_PATHS = {
  job: "/log/job",
  dog: "/log/dog",
  note: "/log/note",
} as const;

export function jobLines(title: string): string[] {
  const lines = title.split("\n").map((line) => line.trim()).filter(Boolean);
  return lines.length > 0 ? lines : [title];
}

export function logLabel(entry: { type: EntryType; title: string; dogName: string | null }): string {
  if (entry.type === "extra_dog_work") return `${entry.title} for ${entry.dogName ?? "a dog"}`;
  const lines = jobLines(entry.title);
  if (lines.length <= 1) return lines[0] ?? entry.title;
  return `${lines[0]} and ${lines.length - 1} more`;
}

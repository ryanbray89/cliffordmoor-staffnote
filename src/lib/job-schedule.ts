import { JOB_FREQUENCY, JOB_TASKS, jobFrequencyLabel, jobLines, type JobRule, type JobTask } from "@/lib/catalog";
import { formatShortDate, londonToday, shiftCivilDate } from "@/lib/time";

export type JobLog = {
  title: string;
  staffName: string;
  happenedOn: string;
  createdAt: string;
};

export type JobStatus = "due" | "overdue" | "ok" | "out_of_season";

export type JobRow = {
  task: JobTask;
  frequency: string;
  status: JobStatus;
  lastDoneOn: string | null;
  lastDoneBy: string | null;
  dueOn: string | null;
};

export type StaffJobChip = {
  due: boolean;
  detail: string;
};

const TASKS = new Set<string>(JOB_TASKS);

function daysBetween(earlier: string, later: string): number {
  const [year1, month1, day1] = earlier.split("-").map(Number);
  const [year2, month2, day2] = later.split("-").map(Number);
  return Math.round((Date.UTC(year2, month2 - 1, day2) - Date.UTC(year1, month1 - 1, day1)) / 86_400_000);
}

function addCalendarMonths(isoDate: string, months: number): string {
  const [year, month, day] = isoDate.split("-").map(Number);
  const target = new Date(Date.UTC(year, month - 1 + months, 1));
  const lastDay = new Date(Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0)).getUTCDate();
  const result = new Date(Date.UTC(target.getUTCFullYear(), target.getUTCMonth(), Math.min(day, lastDay)));
  return result.toISOString().slice(0, 10);
}

function ruleFor(task: JobTask): JobRule {
  return JOB_FREQUENCY[task];
}

function inSeason(task: JobTask, today: string): boolean {
  const rule = ruleFor(task);
  if (rule.season !== "october-april") return true;
  const month = Number(today.slice(5, 7));
  return month >= 10 || month <= 4;
}

function nextDue(task: JobTask, lastOn: string): string {
  const rule = ruleFor(task);
  if (rule.every === "day") return shiftCivilDate(lastOn, 1);
  if (rule.every === "week") return shiftCivilDate(lastOn, 7);
  if (rule.every === "fortnight") return shiftCivilDate(lastOn, 14);
  if (rule.every === "twice-a-week") return shiftCivilDate(lastOn, 3);
  return addCalendarMonths(lastOn, 1);
}

function latestByTask(logs: JobLog[]): Map<JobTask, JobLog> {
  const latest = new Map<JobTask, JobLog>();
  for (const log of logs) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(log.happenedOn)) continue;
    for (const line of jobLines(log.title)) {
      if (!TASKS.has(line)) continue;
      const task = line as JobTask;
      const current = latest.get(task);
      if (
        !current ||
        log.happenedOn > current.happenedOn ||
        (log.happenedOn === current.happenedOn && log.createdAt > current.createdAt)
      ) {
        latest.set(task, log);
      }
    }
  }
  return latest;
}

function statusFor(task: JobTask, last: JobLog | undefined, today: string): Pick<JobRow, "status" | "dueOn"> {
  if (!inSeason(task, today)) return { status: "out_of_season", dueOn: null };
  if (!last) return { status: "due", dueOn: null };
  const dueOn = nextDue(task, last.happenedOn);
  if (today < dueOn) return { status: "ok", dueOn };
  if (today === dueOn) return { status: "due", dueOn };
  return { status: "overdue", dueOn };
}

export function jobBoard(logs: JobLog[], now = new Date()): JobRow[] {
  const today = londonToday(now);
  const latest = latestByTask(logs);
  return JOB_TASKS.map((task) => {
    const last = latest.get(task);
    const { status, dueOn } = statusFor(task, last, today);
    return {
      task,
      frequency: jobFrequencyLabel(task),
      status,
      lastDoneOn: last?.happenedOn ?? null,
      lastDoneBy: last?.staffName ?? null,
      dueOn,
    };
  });
}

function relativeDay(iso: string, today: string): string {
  const days = daysBetween(iso, today);
  if (days === 0) return "today";
  if (days === 1) return "yesterday";
  if (days > 1 && days < 14) return `${days} days ago`;
  return formatShortDate(iso);
}

export function staffJobStatus(logs: JobLog[], now = new Date()): Record<JobTask, StaffJobChip> {
  const today = londonToday(now);
  const board = jobBoard(logs, now);
  const status = {} as Record<JobTask, StaffJobChip>;
  for (const row of board) {
    if (row.status === "out_of_season") {
      status[row.task] = { due: false, detail: "Not in season" };
      continue;
    }
    if (row.status !== "ok" || !row.lastDoneOn || !row.lastDoneBy || !row.dueOn) {
      status[row.task] = { due: true, detail: "Due" };
      continue;
    }
    status[row.task] = {
      due: false,
      detail: `Done ${relativeDay(row.lastDoneOn, today)} by ${row.lastDoneBy} · due ${formatShortDate(row.dueOn)}`,
    };
  }
  return status;
}

export function orderedJobGroup(group: readonly JobTask[], status: Record<JobTask, StaffJobChip>): JobTask[] {
  const due: JobTask[] = [];
  const rest: JobTask[] = [];
  for (const task of group) {
    if (status[task]?.due) due.push(task);
    else rest.push(task);
  }
  return [...due, ...rest];
}

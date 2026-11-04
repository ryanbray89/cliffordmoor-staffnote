import { STATUS_LABEL, TYPE_LABEL } from "@/lib/catalog";
import { formatCsvDate, formatStamp } from "@/lib/time";
import type { Entry } from "@/lib/types";

function cell(value: string | number | null | undefined): string {
  const text = value == null ? "" : String(value);
  if (/[",\r\n]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
  return text;
}

function jobLabel(entry: Entry): string {
  if (entry.jobState === "done") return "Done";
  if (entry.jobState === "needs_doing") return "Needs doing";
  return "";
}

function chargedLabel(entry: Entry): string {
  if (entry.charged === true) return "Yes";
  if (entry.charged === false) return "No";
  return "";
}

function replyCell(entry: Entry): string {
  return entry.replies
    .map((reply) => `${reply.authorName}: ${reply.body} (${formatStamp(reply.createdAt)})`)
    .join(" | ");
}

const HEADERS = [
  "Date",
  "Logged at",
  "Type",
  "Staff",
  "Dog",
  "Owner",
  "Kennel",
  "What",
  "Detail",
  "Area",
  "Job",
  "Quantity",
  "Minutes",
  "Urgent",
  "Status",
  "Charged",
  "Replies",
];

export function toCsv(entries: Entry[]): string {
  const lines = [HEADERS.join(",")];
  for (const entry of entries) {
    lines.push(
      [
        formatCsvDate(entry.happenedOn),
        formatStamp(entry.createdAt),
        TYPE_LABEL[entry.type],
        entry.staffName,
        entry.dogName ?? "",
        entry.ownerName ?? "",
        entry.kennel ?? "",
        entry.title,
        entry.detail,
        entry.area ?? "",
        jobLabel(entry),
        entry.quantity ?? "",
        entry.durationMins ?? "",
        entry.urgent ? "Yes" : "No",
        STATUS_LABEL[entry.status],
        chargedLabel(entry),
        replyCell(entry),
      ]
        .map((value) => cell(value))
        .join(","),
    );
  }
  return `\uFEFF${lines.join("\r\n")}\r\n`;
}

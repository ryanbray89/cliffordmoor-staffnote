import { toCsv } from "@/lib/csv";
import { parseFilters } from "@/lib/filters";
import { isAdmin } from "@/lib/session";
import { getStore } from "@/lib/store";
import { londonToday } from "@/lib/time";

export async function GET(request: Request) {
  if (!(await isAdmin())) {
    return new Response("The office is locked.", { status: 401 });
  }
  const filters = parseFilters(new URL(request.url).searchParams);
  const entries = await getStore().listEntries(filters, 5000);
  const csv = toCsv(entries);
  const filename = `cliffordmoor-staffnote-${londonToday()}.csv`;
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}

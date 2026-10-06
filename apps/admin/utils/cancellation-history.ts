import type {
  CancellationHistoryEntry,
  CancellationHistoryGroup,
} from "@/types/cancellation-history";
import { formatDate } from "@repo/utils";

export function formatCancellationDate(value: string | null): string {
  return !value || Number.isNaN(Date.parse(value))
    ? "Não registrado"
    : formatDate(value, "date-time");
}

export function getCancellationRefundLabel(entry: CancellationHistoryEntry): string {
  if (entry.kind === "ordinary") return "Não se aplica";
  if (entry.refund_completed_at) return formatCancellationDate(entry.refund_completed_at);
  return entry.status === "rejected" ? "Não realizado" : "Não confirmado";
}

export function groupCancellationHistory(
  entries: CancellationHistoryEntry[],
  search: string,
  status: string
): CancellationHistoryGroup[] {
  const query = search.trim().toLocaleLowerCase("pt-BR");
  const groups = new Map<string, CancellationHistoryGroup>();
  // Build complete groups before filtering so counts/attention/latest activity
  // never depend on how many requests match the selected status.
  for (const entry of entries) {
    const group = groups.get(entry.student_id);
    if (!group) {
      groups.set(entry.student_id, {
        studentId: entry.student_id,
        identity: entry.snapshot,
        requestCount: 1,
        lastActivityAt: entry.last_activity_at,
        latestStatus: entry.status,
        requests: [entry],
      });
      continue;
    }
    group.requestCount += 1;
    group.requests.push(entry);
    if (Date.parse(entry.last_activity_at) > Date.parse(group.lastActivityAt)) {
      group.lastActivityAt = entry.last_activity_at;
      group.latestStatus = entry.status;
    }
    // Identity follows the most recent request, regardless of input order.
    if (Date.parse(entry.requested_at) > Date.parse(group.requests[0]!.requested_at)) {
      group.identity = entry.snapshot;
      group.requests.sort((a, b) => Date.parse(b.requested_at) - Date.parse(a.requested_at));
    }
  }
  return [...groups.values()]
    .map((group) => ({
      ...group,
      requests: group.requests
        .filter((entry) => {
          const searchable =
            `${entry.student_id} ${entry.snapshot.student_name ?? ""} ${entry.snapshot.student_email ?? ""}`.toLocaleLowerCase(
              "pt-BR"
            );
          return searchable.includes(query) && (!status || entry.status === status);
        })
        .sort((a, b) => Date.parse(b.requested_at) - Date.parse(a.requested_at)),
    }))
    .filter((group) => group.requests.length > 0)
    .sort((a, b) => Date.parse(b.lastActivityAt) - Date.parse(a.lastActivityAt));
}

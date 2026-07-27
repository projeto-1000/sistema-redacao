import type {
  HistoryDisplayItem,
  SubscriptionHistoryEvent,
  SubscriptionHistoryRpcRow,
} from "@repo/types";

import { mapSubscriptionHistoryItem } from "./map-subscription-history-item";
import { mapSubscriptionHistoryRpcRow } from "./map-subscription-history-rpc-row";

interface BuildSubscriptionHistoryResultParams {
  rows: SubscriptionHistoryRpcRow[] | null;
  limit?: number;
}

interface SubscriptionHistoryResult {
  items: HistoryDisplayItem[];
  totalPages: number;
}

export function buildSubscriptionHistoryResult({
  rows,
  limit = 10,
}: BuildSubscriptionHistoryResultParams): SubscriptionHistoryResult {
  const normalizedRows = rows ?? [];

  const normalizedLimit = Math.min(
    Math.max(limit, 1),
    100
  );

  const events = normalizedRows
    .map(mapSubscriptionHistoryRpcRow)
    .filter(
      (
        event
      ): event is SubscriptionHistoryEvent =>
        event !== null
    );

  const items = events.map(
    mapSubscriptionHistoryItem
  );

  const parsedTotalCount = Number(
    normalizedRows[0]?.total_count ?? 0
  );

  const totalCount = Number.isFinite(
    parsedTotalCount
  )
    ? Math.max(parsedTotalCount, 0)
    : 0;

  return {
    items,

    totalPages:
      totalCount > 0
        ? Math.ceil(
            totalCount / normalizedLimit
          )
        : 0,
  };
}
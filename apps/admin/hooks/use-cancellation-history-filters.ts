import { useMemo, useState } from "react";
import { Activity } from "lucide-react";
import { CANCELLATION_STATUS_OPTIONS } from "@/constants/cancellation-history";
import type { CancellationHistoryEntry } from "@/types/cancellation-history";
import { groupCancellationHistory } from "@/utils/cancellation-history";

export function useCancellationHistoryFilters(entries: CancellationHistoryEntry[]) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const groups = useMemo(
    () => groupCancellationHistory(entries, searchTerm, statusFilter),
    [entries, searchTerm, statusFilter]
  );
  const filterOptions = [
    {
      id: "status",
      label: "Status",
      icon: Activity,
      value: statusFilter,
      onChange: (value: string) => setStatusFilter(value === "all" ? "" : value),
      options: CANCELLATION_STATUS_OPTIONS,
    },
  ];
  return { searchTerm, setSearchTerm, filterOptions, groups };
}

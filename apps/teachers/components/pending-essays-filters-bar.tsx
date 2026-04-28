"use client"

import { usePendingEssayFilters } from "@/hooks/use-pending-essays-filters";
import { TableFilterBar } from "@repo/ui/components/table-filter-bar";

export function PendingEssayFiltersBar() {
  const { searchTerm, setSearchTerm, dateRange, setDateRange } = usePendingEssayFilters();

  return (
    <TableFilterBar
      className="flex-row items-center"
      searchPlaceholder="Buscar por título, eixo temático ou palavra chave..."
      searchTerm={searchTerm}
      onSearchChange={setSearchTerm}
      dateRange={dateRange}
      onDateRangeChange={setDateRange}
    />
  );
}
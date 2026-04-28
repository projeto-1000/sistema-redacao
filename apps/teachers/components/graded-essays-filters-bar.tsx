"use client"


import { useGradedEssayFilters } from "@/hooks/use-graded-essays-filters";
import { TableFilterBar } from "@repo/ui/components/table-filter-bar";

export function GradedEssayFiltersBar() {
  const { searchTerm, setSearchTerm, dateRange, setDateRange } = useGradedEssayFilters();

  return (
    <TableFilterBar
      searchPlaceholder="Buscar por título, eixo temático ou palavra chave..."
      searchTerm={searchTerm}
      onSearchChange={setSearchTerm}
      dateRange={dateRange}
      onDateRangeChange={setDateRange}
    />
  );
}
"use client"

import { TableFilterBar } from "@repo/ui/components/table-filter-bar";
import { useEssayFilters } from "@/hooks/use-essays-filter";

export function EssayFiltersBar() {
  const { searchTerm, setSearchTerm, dateRange, setDateRange, filterOptions } = useEssayFilters();

  return (
    <TableFilterBar
      searchPlaceholder="Buscar por nome, e-mail ou CPF..."
      searchTerm={searchTerm}
      onSearchChange={setSearchTerm}
      filters={filterOptions}
      dateRange={dateRange}
      onDateRangeChange={setDateRange}
      theme="admin"
    />
  );
}
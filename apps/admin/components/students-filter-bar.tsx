"use client"

import { useStudentFilters } from "@/hooks/use-student-filters";
import { TableFilterBar } from "@repo/ui/components/table-filter-bar"

export default function StudentsFilterBar() {
  const {
    searchTerm,
    setSearchTerm,
    dateRange,
    setDateRange,
    filterOptions
  } = useStudentFilters();

  return (
    <TableFilterBar
      searchPlaceholder="Buscar por nome ou e-mail..."
      searchTerm={searchTerm}
      onSearchChange={setSearchTerm}
      filters={filterOptions}
      dateRange={dateRange}
      onDateRangeChange={setDateRange}
      theme="admin"
    />
  )
}
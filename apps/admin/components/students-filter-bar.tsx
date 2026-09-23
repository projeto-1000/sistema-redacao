"use client"

import { useStudentFilters } from "@/hooks/use-student-filters";
import { TableFilterBar } from "@repo/ui/components/table-filter-bar"

interface StudentsFilterBarProps {
  planOptions: { label: string; value: string }[];
}

export default function StudentsFilterBar({ planOptions }: StudentsFilterBarProps) {
  const {
    searchTerm,
    setSearchTerm,
    dateRange,
    setDateRange,
    filterOptions
  } = useStudentFilters(planOptions);

  return (
    <TableFilterBar
      searchPlaceholder="Buscar por nome, e-mail ou ID..."
      searchTerm={searchTerm}
      onSearchChange={setSearchTerm}
      filters={filterOptions}
      dateRange={dateRange}
      onDateRangeChange={setDateRange}
      dateFilterLabel="Data de cadastro"
      theme="admin"
    />
  )
}

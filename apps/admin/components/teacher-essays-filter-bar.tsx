"use client"

import { useTeachersEssayFilter } from "@/hooks/use-teacher-essays-filter";
import { TableFilterBar } from "@repo/ui/components/table-filter-bar";

export default function TeacherEssaysFilterBar() {
  const {
    searchTerm,
    setSearchTerm,
    dateRange,
    setDateRange,
    filterOptions
  } = useTeachersEssayFilter();

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
  )
}
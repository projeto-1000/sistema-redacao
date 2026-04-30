"use client"

import { useTeachersFilters } from "@/hooks/use-teachers-filter";
import { TableFilterBar } from "@repo/ui/components/table-filter-bar";

export default function TeachersFilterBar() {
  const { searchTerm, setSearchTerm, filterOptions } = useTeachersFilters()

  return (
    <TableFilterBar
      searchPlaceholder="Buscar por nome, e-mail ou CPF..."
      searchTerm={searchTerm}
      onSearchChange={setSearchTerm}
      filters={filterOptions}
      theme="admin"
    />
  )
}
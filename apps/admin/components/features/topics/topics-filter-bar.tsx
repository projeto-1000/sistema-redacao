'use client'

import { useTopicsFilters } from "@/hooks/use-topics-filters"
import { TableFilterBar } from "@repo/ui/components/table-filter-bar"

export default function TopicFiltersBar() {
  const { searchTerm, setSearchTerm, filterOptions } = useTopicsFilters()

  return (
    <TableFilterBar
      searchPlaceholder="Buscar título do tema ou eixo temático..."
      searchTerm={searchTerm}
      onSearchChange={setSearchTerm}
      filters={filterOptions}
      theme="admin"
    />
  )
}
import { useEffect, useState } from "react";
import { useDebounce } from "use-debounce";
import { useUrlFilters } from "@repo/hooks";
import type { ThematicAxis } from "@repo/types";

export function useTopicsFilters() {
  const { getFilter, setFilters } = useUrlFilters();

  const [searchTerm, setSearchTerm] = useState(getFilter("search"));
  const [debouncedSearch] = useDebounce(searchTerm, 500);

  useEffect(() => {
    setFilters({ search: debouncedSearch || null });
  }, [debouncedSearch, setFilters]);

  const axisFilter = (getFilter("axis") as ThematicAxis | "Todos") || "Todos";

  const setFilter = (key: string, value: string | null) => {
    setFilters({ [key]: value === "Todos" ? "" : value });
  };

  return { searchTerm, setSearchTerm, axisFilter, setFilter };
}

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useDebounce } from "use-debounce";
import { DateRange } from "react-day-picker";
import { useUrlFilters } from "@repo/hooks";

export function usePendingEssayFilters() {
  const searchParams = useSearchParams();
  const { setFilters } = useUrlFilters();

  const [searchTerm, setSearchTerm] = useState(searchParams.get("search") || "");
  const [debouncedSearch] = useDebounce(searchTerm, 500);

  useEffect(() => {
    setFilters({ search: debouncedSearch || null });
  }, [debouncedSearch, setFilters]);

  const setDateRange = (range: DateRange | undefined) => {
    setFilters({
      from: range?.from ? range.from.toISOString() : null,
      to: range?.to ? range.to.toISOString() : null,
    });
  };


  const dateRange: DateRange | undefined =
    searchParams.get("from") || searchParams.get("to")
      ? {
        from: searchParams.get("from") ? new Date(searchParams.get("from") as string) : undefined,
        to: searchParams.get("to") ? new Date(searchParams.get("to") as string) : undefined,
      }
      : undefined;



  return { searchTerm, setSearchTerm, dateRange, setDateRange };
}

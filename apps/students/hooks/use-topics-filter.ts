import { useCallback, useEffect, useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useDebounce } from "use-debounce";
import type { ThematicAxis } from "@repo/types";

export function useTopicsFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [searchTerm, setSearchTerm] = useState(searchParams.get("search") || "");
  const [debouncedSearch] = useDebounce(searchTerm, 500);

  const setFilter = useCallback(
    (key: string, value: string | null) => {
      const currentQueryString = searchParams.toString();
      const params = new URLSearchParams(currentQueryString);

      if (value && value !== "Todos") {
        params.set(key, value);
      } else {
        params.delete(key);
      }

      const newQueryString = params.toString();

      if (currentQueryString !== newQueryString) {
        router.replace(`${pathname}?${newQueryString}`, { scroll: false });
      }
    },
    [pathname, router, searchParams]
  );

  useEffect(() => {
    setFilter("search", debouncedSearch || null);
  }, [debouncedSearch, setFilter]);

  const axisFilter = (searchParams.get("axis") as ThematicAxis | "Todos") || "Todos";

  return { searchTerm, setSearchTerm, axisFilter, setFilter };
}

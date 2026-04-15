"use client";

import { useCallback } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";

export function useUrlFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const getFilter = useCallback(
    (key: string, fallback = "") => {
      return searchParams.get(key) || fallback;
    },
    [searchParams]
  );

  const setFilters = useCallback(
    (updates: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString());
      let hasChanges = false;

      Object.entries(updates).forEach(([key, value]) => {
        const currentValue = params.get(key) || "";
        const newValue = value === "all" || value === null ? "" : value;

        if (currentValue !== newValue) {
          hasChanges = true;
          if (newValue) {
            params.set(key, newValue);
          } else {
            params.delete(key);
          }
        }
      });

      if (hasChanges) {
        params.delete("page");
        router.replace(`${pathname}?${params.toString()}`, { scroll: false });
      }
    },
    [pathname, router, searchParams]
  );

  return { getFilter, setFilters };
}
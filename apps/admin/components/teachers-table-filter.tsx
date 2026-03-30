"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import { Activity } from "lucide-react";
import { FilterOption, TableFilterBar } from "@repo/ui/components/table-filter-bar";
import { useDebounce } from "use-debounce";

export function TeachersTableFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const currentSearchUrl = searchParams.get("search") || "";
  const currentStatusUrl = searchParams.get("status") || "";

  const [searchTerm, setSearchTerm] = useState(currentSearchUrl);

  const [debouncedSearch] = useDebounce(searchTerm, 500);

  useEffect(() => {
    setSearchTerm(currentSearchUrl);
  }, [currentSearchUrl]);

  useEffect(() => {
    if (debouncedSearch !== currentSearchUrl) {
      updateUrl("search", debouncedSearch);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch]);

  const updateUrl = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());

    if (value && value !== "") {
      params.set(key, value);
    } else {
      params.delete(key);
    }

    params.set("page", "1");
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
  };

  const statusFilter: FilterOption = {
    id: "status",
    label: "Status",
    value: currentStatusUrl,
    icon: Activity,
    options: [
      { label: "Todos", value: "all" },
      { label: "Ativos", value: "active" },
      { label: "Inativos", value: "inactive" },
      { label: "Bloqueado", value: "blocked" },
    ],
    onChange: (value: string) => updateUrl("status", value),
  };

  return (
    <TableFilterBar
      searchPlaceholder="Buscar por nome ou e-mail"
      searchTerm={searchTerm}
      onSearchChange={handleSearchChange}
      filters={[statusFilter]}
    />
  );
}
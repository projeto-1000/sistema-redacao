import { Activity } from "lucide-react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useDebounce } from "use-debounce";

export function useTeachersFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [searchTerm, setSearchTerm] = useState(searchParams.get("search") || "");
  const [statusFilter, setStatusFilter] = useState(searchParams.get("status") || "");

  const [debouncedSearch] = useDebounce(searchTerm, 500);

  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());

    if (debouncedSearch) params.set("search", debouncedSearch);
    else params.delete("search");

    if (statusFilter && statusFilter !== "all") params.set("status", statusFilter);
    else params.delete("status");

    const currentQueryString = searchParams.toString();
    const newQueryString = params.toString();

    if (currentQueryString !== newQueryString) {
      params.delete("page");
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    }
  }, [debouncedSearch, statusFilter, pathname, router, searchParams]);

  const filterOptions = [
    {
      id: "status",
      label: "Status",
      value: statusFilter,
      icon: Activity,
      onChange: setStatusFilter,
      options: [
        { label: "Todos", value: "all" },
        { label: "Ativos", value: "active" },
        { label: "Inativos", value: "inactive" },
        { label: "Bloqueados", value: "blocked" },
      ],
    },
  ];

  return { searchTerm, setSearchTerm, filterOptions };
}

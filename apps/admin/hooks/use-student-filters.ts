import { useEffect, useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useDebounce } from "use-debounce";
import { DateRange } from "react-day-picker";
import { Activity, Layers } from "lucide-react";

export function useStudentFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [searchTerm, setSearchTerm] = useState(searchParams.get("search") || "");
  const [statusFilter, setStatusFilter] = useState(searchParams.get("status") || "");
  const [planFilter, setPlanFilter] = useState(searchParams.get("plan") || "");

  const initialFrom = searchParams.get("from")
    ? new Date(searchParams.get("from") as string)
    : undefined;
  const initialTo = searchParams.get("to") ? new Date(searchParams.get("to") as string) : undefined;

  const [dateRange, setDateRange] = useState<DateRange | undefined>(
    initialFrom || initialTo ? { from: initialFrom, to: initialTo } : undefined
  );

  const [debouncedSearch] = useDebounce(searchTerm, 500);

  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());

    if (debouncedSearch) params.set("search", debouncedSearch);
    else params.delete("search");

    if (statusFilter && statusFilter !== "all") params.set("status", statusFilter);
    else params.delete("status");

    if (planFilter && planFilter !== "all") params.set("plan", planFilter);
    else params.delete("plan");

    if (dateRange?.from) params.set("from", dateRange.from.toISOString());
    else params.delete("from");

    if (dateRange?.to) params.set("to", dateRange.to.toISOString());
    else params.delete("to");

    const currentQueryString = searchParams.toString();
    const newQueryString = params.toString();

    if (currentQueryString !== newQueryString) {
      params.delete("page");
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    }
  }, [debouncedSearch, statusFilter, planFilter, dateRange, pathname, router, searchParams]);

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
    {
      id: "plano",
      label: "Plano",
      value: planFilter,
      icon: Layers,
      onChange: setPlanFilter,
      options: [
        { label: "Todos", value: "all" },
        { label: "Basic", value: "basic" },
        { label: "Premium", value: "premium" },
      ],
    },
  ];

  return { searchTerm, setSearchTerm, dateRange, setDateRange, filterOptions };
}

import { useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { useDebounce } from "use-debounce";
import { DateRange } from "react-day-picker";
import { Activity, Layers } from "lucide-react";
import { useStudentsNavigation } from "@/components/students-navigation-provider";

export function useStudentFilters(planOptions: { label: string; value: string }[]) {
  const { navigate } = useStudentsNavigation();
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
      params.set("page", "1");
      navigate(`${pathname}?${params.toString()}`, {
        replace: true,
        scroll: false,
      });
    }
  }, [debouncedSearch, statusFilter, planFilter, dateRange, pathname, navigate, searchParams]);

  const filterOptions = [
    {
      id: "status",
      label: "Status",
      value: statusFilter,
      icon: Activity,
      onChange: setStatusFilter,
      options: [
        { label: "Todos", value: "all" },
        { label: "Plano ativo", value: "plan_active" },
        { label: "Inadimplente", value: "past_due" },
        { label: "Cancelado", value: "canceled" },
        { label: "Sem plano", value: "no_plan" },
        { label: "Bloqueados", value: "blocked" },
      ],
    },
    {
      id: "plano",
      label: "Plano",
      value: planFilter,
      icon: Layers,
      onChange: setPlanFilter,
      options: [{ label: "Todos", value: "all" }, ...planOptions],
    },
  ];

  return { searchTerm, setSearchTerm, dateRange, setDateRange, filterOptions };
}

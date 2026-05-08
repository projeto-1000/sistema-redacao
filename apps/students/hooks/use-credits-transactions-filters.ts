import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useDebounce } from "use-debounce";
import { DateRange } from "react-day-picker";
import { Activity, Layers } from "lucide-react";
import { useUrlFilters } from "@repo/hooks";
import { TransactionType } from "@repo/types";

export function useTransactionsFilters() {
  const searchParams = useSearchParams();
  const { getFilter, setFilters } = useUrlFilters();

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

  const typeFilter = (getFilter("type") as TransactionType) || "";

  const dateRange: DateRange | undefined =
    searchParams.get("from") || searchParams.get("to")
      ? {
          from: searchParams.get("from") ? new Date(searchParams.get("from") as string) : undefined,
          to: searchParams.get("to") ? new Date(searchParams.get("to") as string) : undefined,
        }
      : undefined;

  const filterOptions = [
    {
      id: "status",
      label: "Status",
      value: typeFilter,
      icon: Activity,
      onChange: (val: string) => setFilters({ status: val }),
      options: [
        { label: "Todos", value: "all" },
        { label: "Nova Assinatura", value: "new_subscription" },
        { label: "Bônus de Mentoria", value: "mentorship_bonus" },
        { label: "Renovação de Assinatura", value: "plan_renewal" },
        { label: "Compra Avulsa", value: "standalone_purchase" },
        { label: "Envio de Redação", value: "essay_usage" },
        { label: "Mudança de Plano", value: "plan_change" },
        { label: "Ajuste Admin", value: "administrative_adjustment" },
      ],
    },
  ];

  return { searchTerm, setSearchTerm, dateRange, setDateRange, filterOptions };
}

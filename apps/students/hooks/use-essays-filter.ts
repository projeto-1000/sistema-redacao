import { useCallback, useEffect, useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useDebounce } from "use-debounce";
import { DateRange } from "react-day-picker";
import { Activity, Layers } from "lucide-react";

export function useEssayFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [searchTerm, setSearchTerm] = useState(searchParams.get("search") || "");
  const [debouncedSearch] = useDebounce(searchTerm, 500);

  const setFilter = useCallback(
    (key: string, value: string | null) => {
      const params = new URLSearchParams(searchParams.toString());

      if (value && value !== "all") {
        params.set(key, value);
      } else {
        params.delete(key);
      }

      params.delete("page");
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [pathname, router, searchParams]
  );

  useEffect(() => {
    setFilter("search", debouncedSearch || null);
  }, [debouncedSearch, setFilter]);

  const setDateRange = useCallback(
    (range: DateRange | undefined) => {
      const params = new URLSearchParams(searchParams.toString());

      if (range?.from) {
        params.set("from", range.from.toISOString());
      } else {
        params.delete("from");
      }

      if (range?.to) {
        params.set("to", range.to.toISOString());
      } else {
        params.delete("to");
      }

      params.delete("page");
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [pathname, router, searchParams]
  );

  const statusFilter = searchParams.get("status") || "all";
  const thematicAxisFilter = searchParams.get("thematicAxis") || "all";
  const totalScoreFilter = searchParams.get("totalScore") || "all";

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
      value: statusFilter,
      icon: Activity,
      onChange: (val: string) => setFilter("status", val),
      options: [
        { label: "Todos", value: "all" },
        { label: "Rascunho", value: "draft" },
        { label: "Pendente", value: "pending" },
        { label: "Em correção", value: "correcting" },
        { label: "Corrigida", value: "corrected" },
        { label: "Devolvida", value: "returned" },
      ],
    },
    {
      id: "thematicAxis",
      label: "Tema",
      value: thematicAxisFilter,
      icon: Layers,
      onChange: (val: string) => setFilter("thematicAxis", val),
      options: [
        { label: "Todos", value: "all" },
        { label: "Meio Ambiente", value: "Meio Ambiente" },
        { label: "Questões Sociais", value: "Questões Sociais" },
        { label: "Saúde", value: "Saúde" },
        { label: "Cultura", value: "Cultura" },
        { label: "Direitos e Cidadania", value: "Direitos e Cidadania" },
        { label: "Educação", value: "Educação" },
        { label: "Tecnologia", value: "Tecnologia" },
        { label: "Economia", value: "Economia" },
      ],
    },
    {
      id: "totalScore",
      label: "Nota",
      value: totalScoreFilter,
      icon: Layers,
      onChange: (val: string) => setFilter("totalScore", val),
      options: [
        { label: "Todas as notas", value: "all" },
        { label: "900 a 1000", value: "900-1000" },
        { label: "700 a 899", value: "700-899" },
        { label: "500 a 699", value: "500-699" },
        { label: "Abaixo de 500", value: "0-499" },
      ],
    },
  ];

  return { searchTerm, setSearchTerm, dateRange, setDateRange, filterOptions };
}

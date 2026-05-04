import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useDebounce } from "use-debounce";
import { DateRange } from "react-day-picker";
import { Activity, Layers } from "lucide-react";
import { useUrlFilters } from "@repo/hooks";

export function useEssayFilters() {
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

  const statusFilter = searchParams.get("status") || "";
  const thematicAxisFilter = searchParams.get("thematicAxis") || "";
  const totalScoreFilter = searchParams.get("totalScore") || "";

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
      onChange: (val: string) => setFilters({ status: val }),
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
      onChange: (val: string) => setFilters({ thematicAxis: val }),
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
      onChange: (val: string) => setFilters({ totalScore: val }),
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

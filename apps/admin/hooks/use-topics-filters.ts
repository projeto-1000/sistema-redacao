import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useDebounce } from "use-debounce";
import { useUrlFilters } from "@repo/hooks";
import { Layers } from "lucide-react";

export function useTopicsFilters() {
  const searchParams = useSearchParams();
  const { setFilters } = useUrlFilters();

  const [searchTerm, setSearchTerm] = useState(searchParams.get("search") || "");
  const [debouncedSearch] = useDebounce(searchTerm, 500);

  useEffect(() => {
    setFilters({ search: debouncedSearch || null });
  }, [debouncedSearch, setFilters]);

  const axisFilter = searchParams.get("axis") || "";

  const filterOptions = [
    {
      id: "axis",
      label: "Eixo Temático",
      value: axisFilter,
      icon: Layers,
      onChange: (val: string) => setFilters({ axis: val }),
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
  ];

  return { searchTerm, setSearchTerm, filterOptions };
}

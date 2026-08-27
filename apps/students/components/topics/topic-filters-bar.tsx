"use client";

import { Search, Leaf, GraduationCap, BriefcaseMedical, Users, Palette, Cpu, Scale, TrendingUp } from "lucide-react";
import { ThematicAxis } from "@repo/types";
import { useTopicsFilters } from "@/hooks/use-topics-filter";
import { PageHeader } from "@repo/ui/components/page-header";

const AXIS_ICONS: Record<ThematicAxis, React.ElementType> = {
  "Meio Ambiente": Leaf,
  "Questões Sociais": Users,
  "Saúde": BriefcaseMedical,
  "Cultura": Palette,
  "Direitos e Cidadania": Scale,
  "Educação": GraduationCap,
  "Tecnologia": Cpu,
  "Economia": TrendingUp,
};

const AXIS_FILTERS: ("Todos" | ThematicAxis)[] = [
  "Todos",
  "Meio Ambiente",
  "Questões Sociais",
  "Saúde",
  "Cultura",
  "Direitos e Cidadania",
  "Educação",
  "Tecnologia",
  "Economia",
];

export function TopicFiltersBar() {
  const { searchTerm, setSearchTerm, axisFilter, setFilter } = useTopicsFilters();

  return (
    <div className="space-y-8">
      <div className="flex flex-col lg:flex-row gap-6 justify-between items-start lg:items-center">
        <PageHeader
          title='Lista Geral de Temas'
          subtitle='Navegue por nossa biblioteca completa de propostas.'
        />

        <div className="relative w-full lg:w-[450px]">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 size-5" />
          <input
            suppressHydrationWarning
            type="text"
            placeholder="Pesquisar por título, eixo ou palavra-chave..."
            className="w-full pl-14 pr-6 py-4 rounded-full bg-white border border-slate-200 text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-sm text-sm font-medium"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <span className="text-slate-400 font-bold text-xs uppercase tracking-widest whitespace-nowrap">
          Filtrar por:
        </span>

        <div className="flex flex-wrap gap-2">
          {AXIS_FILTERS.map((axis) => {
            const Icon = axis === "Todos" ? null : AXIS_ICONS[axis];
            const isActive = axisFilter === axis;

            return (
              <button
                suppressHydrationWarning
                key={axis}
                onClick={() => setFilter("axis", axis)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold border transition-all duration-200
                  ${isActive
                    ? "bg-[#1E3A8A] text-white border-[#1E3A8A] shadow-md shadow-blue-900/20"
                    : "bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                  }
                `}
              >
                {Icon && <Icon className={`size-4 ${isActive ? "text-white" : "text-slate-500"}`} />}
                {axis}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
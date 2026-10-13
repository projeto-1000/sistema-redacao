"use client";

import { Search } from "lucide-react";
import { useTopicsFilters } from "@/hooks/use-topics-filter";
import { PageHeader } from "@repo/ui/components/page-header";
import { AXIS_FILTERS, AXIS_ICONS } from "./topic-filter-options";

export function TopicFiltersBar() {
  const { searchTerm, setSearchTerm, axisFilter, setFilter } = useTopicsFilters();

  return (
    <div className="space-y-8">
      <div className="flex flex-col items-start justify-between gap-6 lg:flex-row lg:items-center">
        <PageHeader
          title="Lista Geral de Temas"
          subtitle="Navegue por nossa biblioteca completa de propostas."
        />

        <div className="relative w-full lg:w-112.5">
          <Search className="absolute top-1/2 left-5 size-5 -translate-y-1/2 text-slate-400" />
          <input
            suppressHydrationWarning
            type="text"
            placeholder="Pesquisar por título, eixo ou palavra-chave..."
            className="focus:ring-primary/20 focus:border-primary w-full rounded-full border border-slate-200 bg-white py-4 pr-6 pl-14 text-sm font-medium text-slate-700 shadow-sm transition-all placeholder:text-slate-400 focus:ring-2 focus:outline-none"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <span className="text-xs font-bold tracking-widest whitespace-nowrap text-slate-400 uppercase">
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
                className={`flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-bold transition-all duration-200 ${
                  isActive
                    ? "border-[#1E3A8A] bg-[#1E3A8A] text-white shadow-md shadow-blue-900/20"
                    : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                } `}
              >
                {Icon && (
                  <Icon className={`size-4 ${isActive ? "text-white" : "text-slate-500"}`} />
                )}
                {axis}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

'use client'

import { useTeachersEssayFilter } from "@/hooks/use-teacher-essays-filter";
import { Button } from "@repo/ui/components/button";
import { TableFilterBar } from "@repo/ui/components/table-filter-bar";
import { FileText, FileDown } from "lucide-react";
import TeacherEssaysRow from "./teacher-essays-row";
import { TablePagination } from "./table-pagination";
import { TeacherEssayListItem } from "@/app/types";

interface TeacherEssayHistoryProps {
  essays: TeacherEssayListItem[];
  totalPages: number;
}

export default function TeacherEssayHistoryTable({ essays, totalPages }: TeacherEssayHistoryProps) {
  const {
    searchTerm,
    setSearchTerm,
    dateRange,
    setDateRange,
    filterOptions
  } = useTeachersEssayFilter();

  return (
    <div className="bg-white border border-slate-200 rounded-4xl p-6 md:p-8 shadow-sm overflow-hidden">

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <div className="size-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <FileText className="size-5" />
          </div>
          <div>
            <h2 className="text-xl font-black">Histórico de correções</h2>
            <p className="text-xs font-medium text-slate-500">
              Acompanhamento detalhado das avaliações realizadas pelo professor.
            </p>
          </div>
        </div>
        <Button variant='secondary' className="h-11 rounded-full hite font-bold px-6 shadow-sm w-full md:w-auto">
          <FileDown className="size-5 mr-2" /> Exportar Relatório
        </Button>
      </div>

      <TableFilterBar
        searchPlaceholder="Buscar por nome, e-mail ou CPF..."
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        filters={filterOptions}
        dateRange={dateRange}
        onDateRangeChange={setDateRange}
        theme="admin"
      />

      <div className="w-full">
        <div className="hidden lg:grid grid-cols-12 gap-4 px-4 py-5 border-b border-slate-100">
          <div className="col-span-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Aluno</div>
          <div className="col-span-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tema / Eixo</div>
          <div className="col-span-1 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Nota</div>
          <div className="col-span-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Status</div>
          <div className="col-span-1 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Prazo</div>
          <div className="col-span-1 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Correção</div>
          <div className="col-span-1 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Detalhes</div>
        </div>

        <div className="divide-y divide-slate-100 pb-6">
          {essays.map((essay) => (
            <TeacherEssaysRow key={essay.id} essay={essay} />
          ))}
        </div>

        <div className={`pt-6 border-t border-slate-200 ${totalPages === 1 ? 'hidden' : 'block'}`}>
          <TablePagination totalPages={totalPages} />
        </div>
      </div>
    </div>
  )
}
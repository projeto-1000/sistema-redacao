"use client";

import { TableFilterBar } from "@repo/ui/components/table-filter-bar";
import { StudentListItem } from "@/app/types";
import { StudentTableRow } from "./student-table-row";
import { useStudentFilters } from "@/hooks/use-student-filters";
import { TablePagination } from "./table-pagination";

interface StudentTableProps {
  students: StudentListItem[];
  totalPages: number;
}

export function StudentTable({ students, totalPages }: StudentTableProps) {
  const {
    searchTerm,
    setSearchTerm,
    dateRange,
    setDateRange,
    filterOptions
  } = useStudentFilters();


  return (
    <>
      <TableFilterBar
        searchPlaceholder="Buscar por nome, e-mail ou CPF..."
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        filters={filterOptions}
        dateRange={dateRange}
        onDateRangeChange={setDateRange}
        theme="admin"
      />

      <div className="rounded-4xl border border-slate-200 overflow-hidden shadow-sm bg-white">

        <div className="hidden lg:grid grid-cols-12 gap-4 px-8 py-5 border-b border-slate-100 bg-slate-50/50">
          <div className="col-span-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Estudante</div>
          <div className="col-span-1 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Status</div>
          <div className="col-span-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Plano Atual</div>
          <div className="col-span-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Créditos Disponíveis</div>
          <div className="col-span-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Vigência do Plano</div>
          <div className="col-span-1 text-right text-[10px] font-bold text-slate-400 uppercase tracking-widest">Ações</div>
        </div>

        <div className="divide-y divide-slate-100">
          {students.length === 0 ? (
            <div className="p-8 text-center text-slate-500">Nenhum aluno encontrado.</div>
          ) : (
            students.map((student) => (
              <StudentTableRow key={student.id} student={student} />
            ))
          )}
        </div>

        <div className={`px-8 py-4 border-t border-slate-100 bg-slate-50 ${totalPages === 1 ? 'hidden' : 'block'}`}>
          <TablePagination totalPages={totalPages} />
        </div>

      </div>
    </>
  );
}
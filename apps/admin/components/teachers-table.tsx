'use client'

import { TeacherListItem } from "@/app/types";
import { useTeachersFilters } from "@/hooks/use-teachers-filter";
import { TableFilterBar } from "@repo/ui/components/table-filter-bar";
import { TeachersTableRow } from "./teachers-table-row";
import { TablePagination } from "./table-pagination";
interface TeacherTableProps {
  teachers: TeacherListItem[];
  totalPages: number;
}

export function TeachersTable({ teachers, totalPages }: TeacherTableProps) {
  const { searchTerm, setSearchTerm, filterOptions } = useTeachersFilters()

  return (
    <>
      <TableFilterBar
        searchPlaceholder="Buscar por nome, e-mail ou CPF..."
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        filters={filterOptions}
        theme="admin"
      />

      <div className="rounded-4xl border border-slate-200 overflow-hidden shadow-sm bg-white">
        <div className="hidden lg:grid grid-cols-12 gap-4 px-8 py-5 border-b border-slate-100 bg-white">
          <div className="col-span-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Professor</div>
          <div className="col-span-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">E-mail</div>
          <div className="col-span-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status</div>
          <div className="col-span-1 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Corrigidas (Mês Atual)</div>
          <div className="col-span-1 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Corrigidas (Total)</div>
          <div className="col-span-1 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Ação</div>
        </div>

        <div className="divide-y divide-slate-100">
          {teachers.length === 0 ? (
            <div className="p-8 text-center text-slate-500">Nenhum aluno encontrado.</div>
          ) : (
            teachers.map((teacher) => (
              <TeachersTableRow key={teacher.id} teacher={teacher} />
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
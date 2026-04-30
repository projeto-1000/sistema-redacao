import { TablePagination } from "@/components/table-pagination";
import { EssayTableFilters } from "./essay-table-filters";
import { StudentEssaysTableRow } from "./student-essays-row";
import { StudentEssaysFilters } from "@/types";
import { getStudentEssays } from "@/app/actions/students";

interface StudentEssaysTableProps {
  studentId: string;
  filters?: StudentEssaysFilters,
  page?: number
}

export async function StudentEssaysTable({ studentId, filters, page }: StudentEssaysTableProps) {
  const { essays, totalPages, error } = await getStudentEssays({ studentId, filters, page });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <h2 className="text-xl font-black">Histórico de redações</h2>
        <EssayTableFilters />
      </div>

      <div className="rounded-4xl border border-slate-200 overflow-hidden shadow-sm bg-white">

        <div className="hidden lg:grid grid-cols-12 gap-4 px-8 py-5 border-b border-slate-100 bg-slate-50/50">
          <div className="col-span-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Redação / Tema</div>
          <div className="col-span-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Data de Envio</div>
          <div className="col-span-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status</div>
          <div className="col-span-1 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Nota Final</div>
          <div className="col-span-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Ação</div>
        </div>

        <div className="divide-y divide-slate-100">
          {error ? (
            <div className="p-8 text-center text-red-500 font-medium">
              se der erro
            </div>
          ) : essays.length === 0 ? (
            <div className="p-8 text-center text-slate-500 font-medium">
              Nenhuma redação encontrada para os filtros aplicados.
            </div>
          ) : (
            essays.map((essay) => (
              <StudentEssaysTableRow key={essay.id} essay={essay} />
            ))
          )}
        </div>

        <div className="px-8 py-4 border-t border-slate-100 bg-slate-50">
          <TablePagination totalPages={totalPages} />
        </div>
      </div>
    </div>
  );
}
import { TablePagination } from "@/components/table-pagination";
import { EssayTableFilters } from "../../essay-table-filters";
import { StudentEssaysTableRow } from "./student-essays-row";
import { StudentEssaysFilters } from "@/types";
import { getStudentEssays } from "@/app/actions/students";
import { CircleAlert, FileText, Search } from "lucide-react";

interface StudentEssaysTableProps {
  studentId: string;
  filters?: StudentEssaysFilters,
  page?: number
}

export async function StudentEssaysTable({ studentId, filters, page }: StudentEssaysTableProps) {
  const { essays, totalPages, error } = await getStudentEssays({ studentId, filters, page });

  const hasActiveFilters = Object.values(filters || {}).some(
    value => value !== undefined && value !== null && value !== ""
  );

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
            <div className="flex flex-col items-center justify-center py-18 px-6 bg-slate-50/50 text-center animate-in fade-in duration-500">
              <CircleAlert className="size-14 bg-white rounded-full text-red-500 p-1 shadow-sm mb-4" />
              <h3 className="text-lg font-bold text-red-600 mb-1">
                Ocorreu um erro.
              </h3>
              <p className="text-slate-600 text-sm max-w-sm leading-relaxed">
                Não conseguimos carregar as redações do aluno. Por favor, recarregue a página ou tente novamente em instantes.
              </p>
            </div>
          ) : essays.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 px-6 bg-slate-50/50 text-center animate-in fade-in duration-500">
              <div className="bg-white p-4 rounded-full shadow-sm mb-4">
                {hasActiveFilters ? <Search className="size-8 text-slate-300" /> : <FileText className="size-8 text-slate-300" />}
              </div>
              <h3 className="text-lg font-bold text-slate-800 mb-1">
                {hasActiveFilters ? "Nenhum resultado encontrado" : "Nenhuma redação por aqui"}
              </h3>
              <p className="text-slate-600 text-sm max-w-sm leading-relaxed">
                {hasActiveFilters
                  ? "Não encontramos nada com o filtro selecionado."
                  : "O aluno ainda não enviou nenhumma redação para correção."}
              </p>
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
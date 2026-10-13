import { EssayTableFilters } from "../../essay-table-filters";
import { StudentEssaysTableRow } from "./student-essays-row";
import { StudentEssaysFilters } from "@/types";
import { getStudentEssays } from "@/app/actions/students";
import { CircleAlert, FileText, Search } from "lucide-react";
import { TablePagination } from "@repo/ui/components/table-pagination";

interface StudentEssaysTableProps {
  studentId: string;
  filters?: StudentEssaysFilters;
  page?: number;
}

export async function StudentEssaysTable({ studentId, filters, page }: StudentEssaysTableProps) {
  const { essays, totalPages, error } = await getStudentEssays({ studentId, filters, page });

  const hasActiveFilters = Object.values(filters || {}).some(
    (value) => value !== undefined && value !== null && value !== ""
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
        <h2 className="text-xl font-black">Histórico de redações</h2>
        <EssayTableFilters />
      </div>

      <div className="overflow-hidden rounded-4xl border border-slate-200 bg-white shadow-sm">
        <div className="hidden grid-cols-12 gap-4 border-b border-slate-100 bg-slate-50/50 px-8 py-5 lg:grid">
          <div className="col-span-5 text-[10px] font-bold tracking-widest text-slate-400 uppercase">
            Redação / Tema
          </div>
          <div className="col-span-2 text-[10px] font-bold tracking-widest text-slate-400 uppercase">
            Data de Envio
          </div>
          <div className="col-span-2 text-[10px] font-bold tracking-widest text-slate-400 uppercase">
            Status
          </div>
          <div className="col-span-1 text-[10px] font-bold tracking-widest text-slate-400 uppercase">
            Nota Final
          </div>
          <div className="col-span-2 text-right text-[10px] font-bold tracking-widest text-slate-400 uppercase">
            Ação
          </div>
        </div>

        <div className="divide-y divide-slate-100">
          {error ? (
            <div className="animate-in fade-in flex flex-col items-center justify-center bg-slate-50/50 px-6 py-18 text-center duration-500">
              <CircleAlert className="mb-4 size-14 rounded-full bg-white p-1 text-red-500 shadow-sm" />
              <h3 className="mb-1 text-lg font-bold text-red-600">Ocorreu um erro.</h3>
              <p className="max-w-sm text-sm leading-relaxed text-slate-600">
                Não conseguimos carregar as redações do aluno. Por favor, recarregue a página ou
                tente novamente em instantes.
              </p>
            </div>
          ) : essays.length === 0 ? (
            <div className="animate-in fade-in flex flex-col items-center justify-center bg-slate-50/50 px-6 py-24 text-center duration-500">
              <div className="mb-4 rounded-full bg-white p-4 shadow-sm">
                {hasActiveFilters ? (
                  <Search className="size-8 text-slate-300" />
                ) : (
                  <FileText className="size-8 text-slate-300" />
                )}
              </div>
              <h3 className="mb-1 text-lg font-bold text-slate-800">
                {hasActiveFilters ? "Nenhum resultado encontrado" : "Nenhuma redação por aqui"}
              </h3>
              <p className="max-w-sm text-sm leading-relaxed text-slate-600">
                {hasActiveFilters
                  ? "Não encontramos nada com o filtro selecionado."
                  : "O aluno ainda não enviou nenhumma redação para correção."}
              </p>
            </div>
          ) : (
            essays.map((essay) => <StudentEssaysTableRow key={essay.id} essay={essay} />)
          )}
        </div>

        {totalPages > 0 && (
          <div className="border-t border-slate-100 bg-slate-50 px-8 py-4">
            <TablePagination totalPages={totalPages} />
          </div>
        )}
      </div>
    </div>
  );
}

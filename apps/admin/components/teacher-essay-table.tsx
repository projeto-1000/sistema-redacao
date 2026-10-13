import { FileText, Search, CircleAlert } from "lucide-react";
import TeacherEssaysRow from "./teacher-essays-row";
import { TablePagination } from "@repo/ui/components/table-pagination";
import { getTeacherEssays } from "@/app/actions/teachers";
import TeacherEssaysFilterBar from "./teacher-essays-filter-bar";
import { TeacherEssayFilters } from "@/types";
import { exportTeacherEssaysCsv } from "@/app/actions/export-teacher-essays-csv";
import { ExportCsvButton } from "@/components/export-csv-button";

interface TeacherEssayProps {
  teacherData: {
    teacherName: string;
    teacherId: string;
  };
  filters?: TeacherEssayFilters;
  page: number;
}

export default async function TeacherEssaysTable({
  teacherData,
  filters,
  page,
}: TeacherEssayProps) {
  const { teacherName, teacherId } = teacherData;

  const { essays, totalPages, error } = await getTeacherEssays({ teacherId, filters, page });

  const searchTerm = filters?.search;

  if (error) {
    return (
      <div className="animate-in fade-in flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-slate-200 bg-slate-50/50 px-6 py-24 text-center duration-500">
        <CircleAlert className="mb-4 size-14 rounded-full bg-white p-1 text-red-500 shadow-sm" />
        <h3 className="mb-1 text-lg font-bold text-red-600">Ocorreu um erro.</h3>
        <p className="max-w-sm text-sm leading-relaxed text-slate-600">
          Não conseguimos carregar as redações. Por favor, recarregue a página ou tente novamente em
          instantes.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-4xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
      <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div className="flex items-center gap-4">
          <div className="flex size-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
            <FileText className="size-5" />
          </div>
          <div>
            <h2 className="text-xl font-black">Histórico de correções</h2>
            <p className="text-sm font-medium text-slate-500">
              Acompanhamento detalhado das avaliações realizadas pelo professor.
            </p>
          </div>
        </div>

        <ExportCsvButton
          action={exportTeacherEssaysCsv}
          payload={{ teacherId, filters }}
          fileName={`historico_redacoes_${teacherName}`}
          className="w-full sm:w-fit"
        />
      </div>

      <TeacherEssaysFilterBar />

      {essays.length > 0 ? (
        <div className="w-full">
          <div className="hidden grid-cols-12 gap-4 border-b border-slate-100 px-4 py-5 lg:grid">
            <div className="col-span-3 text-[10px] font-bold tracking-widest text-slate-400 uppercase">
              Aluno
            </div>
            <div className="col-span-3 text-[10px] font-bold tracking-widest text-slate-400 uppercase">
              Tema / Eixo
            </div>
            <div className="col-span-1 text-center text-[10px] font-bold tracking-widest text-slate-400 uppercase">
              Nota
            </div>
            <div className="col-span-2 text-center text-[10px] font-bold tracking-widest text-slate-400 uppercase">
              Status
            </div>
            <div className="col-span-1 text-center text-[10px] font-bold tracking-widest text-slate-400 uppercase">
              Prazo
            </div>
            <div className="col-span-1 text-[10px] font-bold tracking-widest text-slate-400 uppercase">
              Correção
            </div>
            <div className="col-span-1 text-right text-[10px] font-bold tracking-widest text-slate-400 uppercase">
              Detalhes
            </div>
          </div>

          <div className="divide-y divide-slate-100 pb-6">
            {essays.map((essay) => (
              <TeacherEssaysRow key={essay.id} essay={essay} />
            ))}
          </div>

          <div
            className={`border-t border-slate-200 pt-6 ${totalPages === 1 ? "hidden" : "block"}`}
          >
            <TablePagination totalPages={totalPages} />
          </div>
        </div>
      ) : (
        <div className="animate-in fade-in flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-slate-200 bg-slate-50/50 px-6 py-24 text-center duration-500">
          <div className="mb-4 rounded-full bg-white p-4 shadow-sm">
            {searchTerm ? (
              <Search className="size-8 text-slate-300" />
            ) : (
              <FileText className="size-8 text-slate-300" />
            )}
          </div>
          <h3 className="mb-1 text-lg font-bold text-slate-800">
            {searchTerm ? "Nenhum resultado encontrado" : "Nenhuma redação por aqui"}
          </h3>
          <p className="max-w-sm text-sm leading-relaxed text-slate-600">
            {searchTerm
              ? `Não encontramos nada para "${searchTerm}". Tente buscar por outro título ou eixo temático.`
              : "Você ainda não corrigiu nenhuma redação para correção."}
          </p>
        </div>
      )}
    </div>
  );
}

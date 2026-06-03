
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
    teacherId: string
  },
  filters?: TeacherEssayFilters
  page: number;
}

export default async function TeacherEssaysTable({ teacherData, filters, page }: TeacherEssayProps) {
  const { teacherName, teacherId } = teacherData

  const { essays, totalPages, error } = await getTeacherEssays({ teacherId, filters, page })

  const searchTerm = filters?.search

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-24 px-6 bg-slate-50/50 rounded-3xl border-2 border-dashed border-slate-200 text-center animate-in fade-in duration-500">
        <CircleAlert className="size-14 bg-white rounded-full text-red-500 p-1 shadow-sm mb-4" />
        <h3 className="text-lg font-bold text-red-600 mb-1">
          Ocorreu um erro.
        </h3>
        <p className="text-slate-600 text-sm max-w-sm leading-relaxed">
          Não conseguimos carregar as redações. Por favor, recarregue a página ou tente novamente em instantes.
        </p>
      </div>
    )
  }

  return (
    <div className="bg-white border border-slate-200 rounded-4xl p-6 md:p-8 shadow-sm overflow-hidden">

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <div className="size-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
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
      ) : (
        <div className="flex flex-col items-center justify-center py-24 px-6 bg-slate-50/50 rounded-3xl border-2 border-dashed border-slate-200 text-center animate-in fade-in duration-500">
          <div className="bg-white p-4 rounded-full shadow-sm mb-4">
            {searchTerm ? <Search className="size-8 text-slate-300" /> : <FileText className="size-8 text-slate-300" />}
          </div>
          <h3 className="text-lg font-bold text-slate-800 mb-1">
            {searchTerm ? "Nenhum resultado encontrado" : "Nenhuma redação por aqui"}
          </h3>
          <p className="text-slate-600 text-sm max-w-sm leading-relaxed">
            {searchTerm
              ? `Não encontramos nada para "${searchTerm}". Tente buscar por outro título ou eixo temático.`
              : "Você ainda não corrigiu nenhuma redação para correção."}
          </p>
        </div>
      )}

    </div>
  )
}
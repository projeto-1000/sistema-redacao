
import { CircleAlert, FileText, Search } from "lucide-react";
import { TablePagination } from "./table-pagination";
import GradedEssaysRow from "./graded-essays-row";
import { GradedEssaysFilter } from "@repo/types";
import { getGradedEssays } from "@/app/actions/essays";

interface GradedEssaysProps {
  filters?: GradedEssaysFilter;
  page: number
}

export default async function GradedEssaysGrid({ filters, page }: GradedEssaysProps) {
  const { essays, totalPages, error } = await getGradedEssays({ filters, page });

  const searchTerm = filters?.search

  if (essays.length === 0 && !error) {
    return (
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
    );
  }

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
    <>
      <div className="rounded-4xl border border-slate-200 overflow-hidden shadow-sm bg-white">
        <div className="hidden lg:grid grid-cols-12 gap-4 px-8 py-5 border-b border-slate-100 bg-slate-50/50">
          <div className="col-span-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            Aluno
          </div>
          <div className="col-span-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            Tema da Redação
          </div>
          <div className="col-span-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            Corretor
          </div>
          <div className="col-span-2 text-center lg:text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            Nota Final
          </div>
          <div className="col-span-2 text-right text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            Ação
          </div>
        </div>

        <div className="divide-y divide-slate-100">
          {essays.map((essay) => (
            <GradedEssaysRow key={essay.id} essay={essay} />
          ))}
        </div>
      </div>

      <div>
        <TablePagination totalPages={totalPages} />
      </div>

    </>
  )
}
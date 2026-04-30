import { getEssaysByStatus } from "@/app/actions/essays";
import PendingEssaysRow from "./pending-essays-row";
import { PendingEssaysFilter } from "@repo/types";

import { CircleAlert, FileText, Search } from "lucide-react";
import { TablePagination } from "./table-pagination";

interface PendingEssaysTableProps {
  showHeader?: boolean
  filters?: PendingEssaysFilter;
  page: number
}

export default async function PendingEssaysTable({ showHeader = false, filters, page }: PendingEssaysTableProps) {
  const { essays, totalPages, error } = await getEssaysByStatus({ status: ['pending', 'correcting'], filters, page });

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
            : "Não há redações na fila para correção."}
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
      <div className="rounded-4xl border border-slate-200 overflow-hidden shadow-sm mt-8 bg-white">
        {showHeader && (
          <div className="flex justify-between items-center p-8">
            <h3 className="text-lg font-bold">Fila de Correção</h3>
            <button className="text-sm font-bold text-blue-600 hover:text-blue-700 transition-colors">
              Ver fila completa
            </button>
          </div>
        )}

        <div className={`hidden lg:grid grid-cols-12 gap-4 px-8 pb-5 border-b border-slate-100 ${showHeader === true ? 'bg-transparent pb-5' : 'bg-slate-50/50 py-5'}`}>
          {/* <div className={`hidden lg:grid grid-cols-12 gap-4 px-8 ${type === 'admin' ? 'pb-5' : 'py-5'} border-b border-slate-100 ${type === 'admin' ? 'bg-transparent' : 'bg-slate-50/50'}`}> */}
          <div className="col-span-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Aluno</div>
          <div className="col-span-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tema da Redação</div>
          <div className="col-span-2 text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">Prazo</div>
          <div className="col-span-2 text-right text-[10px] font-bold text-slate-400 uppercase tracking-widest">Ação</div>
        </div>

        {essays.map((essay) => (
          <PendingEssaysRow key={essay.id} essay={essay} />
        ))}
      </div>

      <div>
        <TablePagination totalPages={totalPages} />
      </div>
    </>
  )
}
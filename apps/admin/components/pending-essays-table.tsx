import { getEssaysByStatus } from "@/app/actions/essays";
import PendingEssaysRow from "./pending-essays-row";
import { PendingEssaysFilter } from "@repo/types";
import { CircleAlert, FileText, Search } from "lucide-react";
import { PendingEssaysTable as SharedPendingEssaysTable } from "@repo/ui/components/features/essays/pending-essays-table";
import { TablePagination } from "@repo/ui/components/table-pagination";
interface PendingEssaysTableProps {
  showHeader?: boolean
  filters?: PendingEssaysFilter;
  page: number
}

export default async function PendingEssaysTable({ showHeader = false, filters, page }: PendingEssaysTableProps) {
  const { essays, totalPages, error } = await getEssaysByStatus({ status: ['pending', 'correcting'], filters, page });

  const searchTerm = filters?.search


  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-24 px-6 bg-slate-100 rounded-3xl border-2 border-dashed border-slate-200 text-center animate-in fade-in duration-500">
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
    essays.length > 0 ? (
      <>
        <SharedPendingEssaysTable
          heading={showHeader ? "Fila de Correção" : undefined}
          viewAllHref={showHeader ? "/redacoes-pendentes" : undefined}
        >
          {essays.map((essay) => (
            <PendingEssaysRow key={essay.id} essay={essay} />
          ))}
        </SharedPendingEssaysTable>

        <TablePagination totalPages={totalPages} />
      </>
    ) : (
      <div className="flex flex-col items-center justify-center py-24 px-6 bg-slate-100 rounded-3xl border-2 border-dashed border-slate-200 text-center animate-in fade-in duration-500">
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
    )
  )
}

import { getEssaysByStatus } from "@/app/actions/essays";
import PendingEssaysRow from "./pending-essays-row";
import { PendingEssaysFilter } from "@repo/types";
import { CircleAlert, FileText, Search } from "lucide-react";
import { PendingEssaysTable as SharedPendingEssaysTable } from "@repo/ui/components/features/essays/pending-essays-table";
import { TablePagination } from "@repo/ui/components/table-pagination";
interface PendingEssaysTableProps {
  showHeader?: boolean;
  filters?: PendingEssaysFilter;
  page: number;
}

export default async function PendingEssaysTable({
  showHeader = false,
  filters,
  page,
}: PendingEssaysTableProps) {
  const { essays, totalPages, error } = await getEssaysByStatus({
    status: ["pending", "correcting"],
    filters,
    page,
  });

  const searchTerm = filters?.search;

  if (error) {
    return (
      <div className="animate-in fade-in flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-slate-200 bg-slate-100 px-6 py-24 text-center duration-500">
        <CircleAlert className="mb-4 size-14 rounded-full bg-white p-1 text-red-500 shadow-sm" />
        <h3 className="mb-1 text-lg font-bold text-red-600">Ocorreu um erro.</h3>
        <p className="max-w-sm text-sm leading-relaxed text-slate-600">
          Não conseguimos carregar as redações. Por favor, recarregue a página ou tente novamente em
          instantes.
        </p>
      </div>
    );
  }

  return essays.length > 0 ? (
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
    <div className="animate-in fade-in flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-slate-200 bg-slate-100 px-6 py-24 text-center duration-500">
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
          : "Não há redações na fila para correção."}
      </p>
    </div>
  );
}

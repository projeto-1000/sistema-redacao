import { getStudentEssays } from "@/app/actions/get-essays";

import { Search, FileText, CircleAlert } from "lucide-react";
import { EssaysFilter } from "@/types";
import { EssayCard } from "./essay-card";
import { TablePagination } from "@repo/ui/components/table-pagination";

interface EssayGridProps {
  filters?: EssaysFilter;
  page: number;
}

export async function EssayGrid({ filters, page }: EssayGridProps) {
  const { essays, totalPages, error } = await getStudentEssays({ filters, page });

  const searchTerm = filters?.search;

  if (error) {
    return (
      <div className="animate-in fade-in flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-slate-200 bg-slate-50/50 px-6 py-24 text-center duration-500">
        <CircleAlert className="mb-4 size-14 rounded-full bg-white p-1 text-red-500 shadow-sm" />
        <h3 className="mb-1 text-lg font-bold text-red-600">Ocorreu um erro.</h3>
        <p className="max-w-sm text-sm leading-relaxed text-slate-600">
          Não conseguimos carregar suas redações. Por favor, recarregue a página ou tente novamente
          em instantes.
        </p>
      </div>
    );
  }

  return (
    <>
      {essays.length > 0 ? (
        <div className="mb-12 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {essays?.map((essay) => (
            <EssayCard key={essay.id} essay={essay} />
          ))}
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
              : "Você ainda não enviou nenhuma redação para correção."}
          </p>
        </div>
      )}

      <TablePagination totalPages={totalPages} />
    </>
  );
}

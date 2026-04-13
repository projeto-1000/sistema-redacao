
import { getStudentEssays } from "@/app/actions/get-essays";
import { EssayCard } from "./essay-card";
import { Search, FileText, CircleAlert } from "lucide-react";
import { TablePagination } from "./table-pagination";
import { EssaysFilter } from "@/types";

interface EssayGridProps {
  filters?: EssaysFilter;
  page: number;
}

export async function EssayGrid({ filters, page }: EssayGridProps) {
  const { essays, totalPages, error } = await getStudentEssays({ filters, page });

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
            : "Você ainda não enviou nenhuma redação para correção."}
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
          Não conseguimos carregar suas redações. Por favor, recarregue a página ou tente novamente em instantes.
        </p>
      </div>
    )
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
        {essays?.map((essay) => (
          <EssayCard key={essay.id} essay={essay} />
        ))}
      </div>

      <div>
        <TablePagination totalPages={totalPages} />
      </div>
    </>
  );
}
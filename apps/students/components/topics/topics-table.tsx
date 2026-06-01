import { getTopicsList } from "@/app/actions/get-topics";
import { TopicsFilter } from "@repo/types";

import TopicsRow from "./topics-row";
import { CircleAlert, Search } from "lucide-react";
import { TablePagination } from "@repo/ui/components/table-pagination";

interface TopicsTableProps {
  filters: TopicsFilter;
  page: number
}

export async function TopicsTable({ filters, page }: TopicsTableProps) {
  const { topics, totalPages, error } = await getTopicsList({ filters, page });
  const searchTerm = filters.search;

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-24 px-6 bg-slate-50/50 rounded-4xl border-2 border-dashed border-slate-200 text-center mt-8">
        <CircleAlert className="size-8 text-red-400 mb-4" />
        <h3 className="text-lg font-bold text-slate-800 mb-1">
          Ops! Algo deu errado.
        </h3>
        <p className="text-slate-500 text-sm max-w-xs leading-relaxed">
          Tivemos um problema ao carregar a lista de temas. Tente novamente mais tarde.
        </p>
      </div>
    );
  }

  return (
    <>
      {topics.length > 0 ? (
        <div className="rounded-4xl bg-white border border-slate-200 overflow-hidden shadow-sm mt-8">
          <div className="hidden lg:grid grid-cols-12 gap-4 px-8 py-5 border-b border-slate-100 bg-slate-50/50">
            <div className="col-span-5 xl:col-span-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              Título do Tema
            </div>
            <div className="col-span-3 text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              Eixo Temático
            </div>
            <div className="col-span-4 xl:col-span-3 text-right text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              Ação
            </div>
          </div>

          <div className="divide-y divide-slate-100">
            {topics.map((topic) => (
              <TopicsRow key={topic.id} topic={topic} />
            ))}
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-24 px-6 bg-slate-50/50 rounded-4xl border-2 border-dashed border-slate-200 text-center mt-8">
          <div className="bg-white p-4 rounded-full shadow-sm mb-4">
            <Search className="size-8 text-slate-300" />
          </div>
          <h3 className="font-bold text-lg mb-1">Nenhum tema encontrado</h3>
          <p className="text-slate-500">
            {searchTerm
              ? `Não encontramos nada para "${searchTerm}".`
              : "Tente buscar por outros termos ou mude o filtro."}
          </p>
        </div>
      )}

      <TablePagination totalPages={totalPages} />
    </>
  );
}
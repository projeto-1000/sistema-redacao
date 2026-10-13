import { getTopicsList } from "@/app/actions/get-topics";
import { TopicsFilter } from "@repo/types";

import TopicsRow from "./topics-row";
import { CircleAlert, Search } from "lucide-react";
import { TablePagination } from "@repo/ui/components/table-pagination";

interface TopicsTableProps {
  filters: TopicsFilter;
  page: number;
}

export async function TopicsTable({ filters, page }: TopicsTableProps) {
  const { topics, totalPages, error } = await getTopicsList({ filters, page });
  const searchTerm = filters.search;

  if (error) {
    return (
      <div className="mt-8 flex flex-col items-center justify-center rounded-4xl border-2 border-dashed border-slate-200 bg-slate-50/50 px-6 py-24 text-center">
        <CircleAlert className="mb-4 size-8 text-red-400" />
        <h3 className="mb-1 text-lg font-bold text-slate-800">Ops! Algo deu errado.</h3>
        <p className="max-w-xs text-sm leading-relaxed text-slate-500">
          Tivemos um problema ao carregar a lista de temas. Tente novamente mais tarde.
        </p>
      </div>
    );
  }

  return (
    <>
      {topics.length > 0 ? (
        <div className="mt-8 overflow-hidden rounded-4xl border border-slate-200 bg-white shadow-sm">
          <div className="hidden grid-cols-12 gap-4 border-b border-slate-100 bg-slate-50/50 px-8 py-5 lg:grid">
            <div className="col-span-5 text-[10px] font-bold tracking-widest text-slate-400 uppercase xl:col-span-6">
              Título do Tema
            </div>
            <div className="col-span-3 text-center text-[10px] font-bold tracking-widest text-slate-400 uppercase">
              Eixo Temático
            </div>
            <div className="col-span-4 text-right text-[10px] font-bold tracking-widest text-slate-400 uppercase xl:col-span-3">
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
        <div className="mt-8 flex flex-col items-center justify-center rounded-4xl border-2 border-dashed border-slate-200 bg-slate-50/50 px-6 py-24 text-center">
          <div className="mb-4 rounded-full bg-white p-4 shadow-sm">
            <Search className="size-8 text-slate-300" />
          </div>
          <h3 className="mb-1 text-lg font-bold">Nenhum tema encontrado</h3>
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

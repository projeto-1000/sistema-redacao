import { getTopicsList } from "@/app/actions/topics";
import { TablePagination } from "@repo/ui/components/table-pagination";
import { TopicsFilter } from "@repo/types";
import TopicCard from "./topic-card";
import { CircleAlert, FileText, Search } from "lucide-react";

interface TopicsGridProps {
  filters?: TopicsFilter;
  page: number;
}

export default async function TopicsGrid({ filters, page }: TopicsGridProps) {
  const { topics, totalPages, error } = await getTopicsList({ filters, page });
  const searchTerm = filters?.search;

  if (error) {
    return (
      <div className="animate-in fade-in flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-slate-200 bg-slate-200/30 px-6 py-24 text-center duration-500">
        <CircleAlert className="mb-4 size-14 rounded-full bg-white p-1 text-red-500 shadow-sm" />
        <h3 className="mb-1 text-lg font-bold text-red-600">Ocorreu um erro.</h3>
        <p className="max-w-sm text-sm leading-relaxed text-slate-600">
          Não conseguimos carregar a lista de temas. Por favor, recarregue a página ou tente
          novamente em instantes.
        </p>
      </div>
    );
  }

  return topics.length > 0 ? (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
      {topics?.map((topic) => (
        <TopicCard key={topic.id} topic={topic} />
      ))}

      <TablePagination totalPages={totalPages} />
    </div>
  ) : (
    <div className="animate-in fade-in flex min-w-full flex-col items-center justify-center rounded-3xl border-2 border-dashed border-slate-200 bg-slate-200/30 px-6 py-24 text-center duration-500">
      <div className="mb-4 rounded-full bg-white p-4 shadow-sm">
        {searchTerm ? (
          <Search className="size-8 text-slate-300" />
        ) : (
          <FileText className="size-8 text-slate-300" />
        )}
      </div>
      <h3 className="mb-1 text-lg font-bold text-slate-800">
        {searchTerm ? "Nenhum resultado encontrado" : "Nenhum tema por aqui"}
      </h3>
      <p className="max-w-sm text-sm leading-relaxed text-slate-600">
        {searchTerm
          ? `Não encontramos nada para "${searchTerm}". Tente buscar por outro título ou eixo temático.`
          : "Ainda não há temas cadastrados na plataforma."}
      </p>
    </div>
  );
}

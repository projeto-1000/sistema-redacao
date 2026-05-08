import { NotebookPen, Search, CircleAlert } from "lucide-react";
import { Button } from "@repo/ui/components/button";
import { ThemeBadge } from "@repo/ui/components/theme-badge";
import { TopicDetailsDialog } from "@/components/topic-details-dialog";
import Link from "next/link";
import { getTopicsList } from "@/app/actions/get-topics";
import { TopicsFilter } from "@repo/types";
interface TopicsTableProps {
  filters: TopicsFilter;
}

export async function TopicsTable({ filters }: TopicsTableProps) {
  const { topics, error } = await getTopicsList({ filters });
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
    topics.length > 0 ? (
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
            <div
              key={topic.id}
              className="grid grid-cols-1 lg:grid-cols-12 gap-4 px-6 md:px-8 py-5 items-center hover:bg-slate-50 transition-colors group"
            >
              <div className="lg:col-span-5 xl:col-span-6">
                <h4 className="font-bold leading-snug group-hover:text-[#1E3A8A] transition-colors wrap-break-word">
                  {topic.title}
                </h4>
                <div className="lg:hidden mt-3">
                  <ThemeBadge
                    className="inline-flex px-3 py-1 text-[10px] font-bold uppercase rounded-full border"
                    value={topic.axis}
                  />
                </div>
              </div>

              <div className="hidden lg:flex lg:col-span-3 justify-center px-2">
                <ThemeBadge
                  className="w-full max-w-40 md:max-w-30 lg:max-w-40 px-2 py-1.5 text-[10px] font-bold uppercase rounded-full border tracking-wide h-auto whitespace-normal text-center flex items-center justify-center min-h-7 leading-tight"
                  value={topic.axis}
                />
              </div>

              <div className="lg:col-span-4 xl:col-span-3 flex flex-row gap-2 justify-between md:justify-end mt-4 lg:mt-0">
                <TopicDetailsDialog topic={topic} />

                <Button
                  asChild
                  className="rounded-2xl text-xs font-bold bg-primary shadow-sm min-h-10 whitespace-nowrap w-1/2 md:w-fit shrink-0"
                >
                  <Link href={`/minhas-redacoes/nova-redacao?id=${topic.id}`}>
                    Iniciar Redação
                    <NotebookPen className="size-3.5" />
                  </Link>
                </Button>
              </div>
            </div>
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
    )
  );
}
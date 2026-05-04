import { getTopicsList } from "@/app/actions/topics"
import { TablePagination } from "@/components/table-pagination"
import { TopicsFilter } from "@repo/types"
import TopicCard from "./topic-card"
import { CircleAlert, FileText, Search } from "lucide-react"

interface TopicsGridProps {
  filters?: TopicsFilter
  page: number
}

export default async function TopicsGrid({ filters, page }: TopicsGridProps) {

  const { topics, totalPages, error } = await getTopicsList({ filters, page })
  const searchTerm = filters?.search

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-24 px-6 bg-slate-200/30 rounded-3xl border-2 border-dashed border-slate-200 text-center animate-in fade-in duration-500">
        <CircleAlert className="size-14 bg-white rounded-full text-red-500 p-1 shadow-sm mb-4" />
        <h3 className="text-lg font-bold text-red-600 mb-1">
          Ocorreu um erro.
        </h3>
        <p className="text-slate-600 text-sm max-w-sm leading-relaxed">
          Não conseguimos carregar a lista de temas. Por favor, recarregue a página ou tente novamente em instantes.
        </p>
      </div>
    )
  }

  return (
    <>
      {topics.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {topics?.map((topic) => (
            <TopicCard key={topic.id} topic={topic} />
          ))}

          <TablePagination totalPages={totalPages} />
        </div>

      ) : (
        <div className="flex flex-col items-center justify-center py-24 px-6 bg-slate-200/30 rounded-3xl border-2 border-dashed border-slate-200 text-center animate-in fade-in duration-500 min-w-full">
          <div className="bg-white p-4 rounded-full shadow-sm mb-4">
            {searchTerm ? <Search className="size-8 text-slate-300" /> : <FileText className="size-8 text-slate-300" />}
          </div>
          <h3 className="text-lg font-bold text-slate-800 mb-1">
            {searchTerm ? "Nenhum resultado encontrado" : "Nenhum tema por aqui"}
          </h3>
          <p className="text-slate-600 text-sm max-w-sm leading-relaxed">
            {searchTerm
              ? `Não encontramos nada para "${searchTerm}". Tente buscar por outro título ou eixo temático.`
              : "Nenhum resultado encontrado"}
          </p>
        </div>
      )}
    </>
  )
}
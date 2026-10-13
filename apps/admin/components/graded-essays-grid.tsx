import { CircleAlert, FileText, Search } from "lucide-react";
import GradedEssaysRow from "./graded-essays-row";
import { GradedEssaysFilter } from "@repo/types";
import { getGradedEssays } from "@/app/actions/essays";
import { TablePagination } from "@repo/ui/components/table-pagination";

interface GradedEssaysProps {
  filters?: GradedEssaysFilter;
  page: number;
}

export default async function GradedEssaysGrid({ filters, page }: GradedEssaysProps) {
  const { essays, totalPages, error } = await getGradedEssays({ filters, page });

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
      <div className="overflow-hidden rounded-4xl border border-slate-200 bg-white shadow-sm">
        <div className="hidden grid-cols-12 gap-4 border-b border-slate-100 bg-slate-50/50 px-8 py-5 lg:grid">
          <div className="col-span-3 text-[10px] font-bold tracking-widest text-slate-400 uppercase">
            Aluno
          </div>
          <div className="col-span-3 text-[10px] font-bold tracking-widest text-slate-400 uppercase">
            Tema da Redação
          </div>
          <div className="col-span-2 text-[10px] font-bold tracking-widest text-slate-400 uppercase">
            Corretor
          </div>
          <div className="col-span-2 text-center text-[10px] font-bold tracking-widest text-slate-400 uppercase lg:text-left">
            Nota Final
          </div>
          <div className="col-span-2 text-right text-[10px] font-bold tracking-widest text-slate-400 uppercase">
            Ação
          </div>
        </div>

        <div className="divide-y divide-slate-100">
          {essays.map((essay) => (
            <GradedEssaysRow key={essay.id} essay={essay} />
          ))}
        </div>
      </div>

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
          : "Você ainda não corrigiu nenhuma redação para correção."}
      </p>
    </div>
  );
}

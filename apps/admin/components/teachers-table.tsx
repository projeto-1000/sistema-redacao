import { TeachersFilters } from "@/types";
import { TeachersTableRow } from "./teachers-table-row";
import { TablePagination } from "@repo/ui/components/table-pagination";
import { getTeachers } from "@/app/actions/teachers";
import { CircleAlert, FileText, Search } from "lucide-react";
interface TeacherTableProps {
  filters?: TeachersFilters;
  page: number
}

export async function TeachersTable({ filters, page }: TeacherTableProps) {
  const { teachers, totalPages, error } = await getTeachers({ filters, page })

  const searchTerm = filters?.search

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-24 px-6 bg-slate-50/50 rounded-3xl border-2 border-dashed border-slate-200 text-center animate-in fade-in duration-500">
        <CircleAlert className="size-14 bg-white rounded-full text-red-500 p-1 shadow-sm mb-4" />
        <h3 className="text-lg font-bold text-red-600 mb-1">
          Ocorreu um erro.
        </h3>
        <p className="text-slate-600 text-sm max-w-sm leading-relaxed">
          Não conseguimos carregar a lista de professores. Por favor, recarregue a página ou tente novamente em instantes.
        </p>
      </div>
    )
  }

  return (
    teachers.length > 0 ? (
      <>
        <div className="rounded-4xl border border-slate-200 overflow-hidden shadow-sm bg-white">
          <div className="hidden lg:grid grid-cols-12 gap-4 px-8 py-5 border-b border-slate-100 bg-white">
            <div className="col-span-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Professor</div>
            <div className="col-span-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">E-mail</div>
            <div className="col-span-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status</div>
            <div className="col-span-1 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Corrigidas (Mês Atual)</div>
            <div className="col-span-1 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Corrigidas (Total)</div>
            <div className="col-span-1 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Ação</div>
          </div>

          <div className="divide-y divide-slate-100">
            {teachers?.map((teacher) => (
              <TeachersTableRow key={teacher.id} teacher={teacher} />
            ))}
          </div>
        </div>

        <TablePagination totalPages={totalPages} />
      </>
    ) : (
      <div className="flex flex-col items-center justify-center py-24 px-6 bg-slate-50/50 rounded-3xl border-2 border-dashed border-slate-200 text-center animate-in fade-in duration-500">
        <div className="bg-white p-4 rounded-full shadow-sm mb-4">
          {searchTerm ? <Search className="size-8 text-slate-300" /> : <FileText className="size-8 text-slate-300" />}
        </div>
        <h3 className="text-lg font-bold text-slate-800 mb-1">
          {searchTerm ? "Nenhum resultado encontrado" : "Nenhum professor por aqui"}
        </h3>
        <p className="text-slate-600 text-sm max-w-sm leading-relaxed">
          {searchTerm
            ? `Não encontramos nada para "${searchTerm}". Tente buscar por outro nome, CPF ou e-mail`
            : "Ainda não há professores cadastrados na plataforma"}
        </p>
      </div>
    )
  )
}
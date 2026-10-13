import { TeachersFilters } from "@/types";
import { TeachersTableRow } from "./teachers-table-row";
import { TablePagination } from "@repo/ui/components/table-pagination";
import { getTeachers } from "@/app/actions/teachers";
import { CircleAlert, FileText, Search } from "lucide-react";
interface TeacherTableProps {
  filters?: TeachersFilters;
  page: number;
}

export async function TeachersTable({ filters, page }: TeacherTableProps) {
  const { teachers, totalPages, error } = await getTeachers({ filters, page });

  const searchTerm = filters?.search;

  if (error) {
    return (
      <div className="animate-in fade-in flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-slate-200 bg-slate-50/50 px-6 py-24 text-center duration-500">
        <CircleAlert className="mb-4 size-14 rounded-full bg-white p-1 text-red-500 shadow-sm" />
        <h3 className="mb-1 text-lg font-bold text-red-600">Ocorreu um erro.</h3>
        <p className="max-w-sm text-sm leading-relaxed text-slate-600">
          Não conseguimos carregar a lista de professores. Por favor, recarregue a página ou tente
          novamente em instantes.
        </p>
      </div>
    );
  }

  return teachers.length > 0 ? (
    <>
      <div className="overflow-hidden rounded-4xl border border-slate-200 bg-white shadow-sm">
        <div className="hidden grid-cols-12 gap-4 border-b border-slate-100 bg-white px-8 py-5 lg:grid">
          <div className="col-span-4 text-[10px] font-bold tracking-widest text-slate-400 uppercase">
            Professor
          </div>
          <div className="col-span-3 text-[10px] font-bold tracking-widest text-slate-400 uppercase">
            E-mail
          </div>
          <div className="col-span-2 text-[10px] font-bold tracking-widest text-slate-400 uppercase">
            Status
          </div>
          <div className="col-span-1 text-center text-[10px] font-bold tracking-widest text-slate-400 uppercase">
            Corrigidas (Mês Atual)
          </div>
          <div className="col-span-1 text-center text-[10px] font-bold tracking-widest text-slate-400 uppercase">
            Corrigidas (Total)
          </div>
          <div className="col-span-1 text-right text-[10px] font-bold tracking-widest text-slate-400 uppercase">
            Ação
          </div>
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
    <div className="animate-in fade-in flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-slate-200 bg-slate-50/50 px-6 py-24 text-center duration-500">
      <div className="mb-4 rounded-full bg-white p-4 shadow-sm">
        {searchTerm ? (
          <Search className="size-8 text-slate-300" />
        ) : (
          <FileText className="size-8 text-slate-300" />
        )}
      </div>
      <h3 className="mb-1 text-lg font-bold text-slate-800">
        {searchTerm ? "Nenhum resultado encontrado" : "Nenhum professor por aqui"}
      </h3>
      <p className="max-w-sm text-sm leading-relaxed text-slate-600">
        {searchTerm
          ? `Não encontramos nada para "${searchTerm}". Tente buscar por outro nome, CPF ou e-mail`
          : "Ainda não há professores cadastrados na plataforma"}
      </p>
    </div>
  );
}

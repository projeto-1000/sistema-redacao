import { getStudents } from "@/app/action/students";
import { CircleAlert, FileText, Search } from "lucide-react";
import { TablePagination } from "./table-pagination";
import { StudentsTableRow } from "./students-table-row";
import { StudentsFilter } from "@repo/types";

interface StudentsTableProps {
  filters: StudentsFilter;
  page: number;
}

export async function StudentsTable({ filters, page }: StudentsTableProps) {
  const { students, totalPages, error } = await getStudents({ filters, page })

  const searchTerm = filters?.search

  if (students.length === 0 && !error) {
    return (
      <div className="flex flex-col items-center justify-center py-24 px-6 bg-slate-50/50 rounded-3xl border-2 border-dashed border-slate-200 text-center animate-in fade-in duration-500">
        <div className="bg-white p-4 rounded-full shadow-sm mb-4">
          {searchTerm ? <Search className="size-8 text-slate-300" /> : <FileText className="size-8 text-slate-300" />}
        </div>
        <h3 className="text-lg font-bold text-slate-800 mb-1">
          {searchTerm ? "Nenhum resultado encontrado" : "Nenhum aluno cadastrado"}
        </h3>
        <p className="text-slate-600 text-sm max-w-sm leading-relaxed">
          {searchTerm
            ? `Não encontramos nada para "${searchTerm}". Tente buscar por nome ou e-mail.`
            : "Nenhum aluno cadastrado."}
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
          Não conseguimos carregar a lista de alunos. Por favor, recarregue a página ou tente novamente em instantes.
        </p>
      </div>
    )
  }

  return (
    <>
      <div className="rounded-4xl border border-slate-200 overflow-hidden shadow-sm bg-white">
        <div className="hidden lg:grid grid-cols-12 gap-4 px-8 py-5 border-b border-slate-100 bg-slate-50/50">
          <div className="col-span-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Aluno</div>
          <div className="col-span-1 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Status</div>
          <div className="col-span-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Plano Atual</div>
          <div className="col-span-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Créditos Disponíveis</div>
          <div className="col-span-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Vigência do Plano</div>
          <div className="col-span-1 text-right text-[10px] font-bold text-slate-400 uppercase tracking-widest">Ações</div>
        </div>

        <div className="divide-y divide-slate-100">
          {students.map((student) => (
            <StudentsTableRow key={student.id} student={student} />
          ))}
        </div>

      </div>

      <TablePagination totalPages={totalPages} />
    </>
  );
}
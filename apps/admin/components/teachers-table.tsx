import { Ban, CheckCircle2, Eye } from "lucide-react";
import { Button } from "@repo/ui/components/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@repo/ui/components/tooltip";
import { TablePagination } from "@/components/table-pagination";
import { getTeachers } from "@/app/action/get-teachers-data";
import { Avatar } from "@repo/ui/components/avatar";


interface TeachersTableProps {
  currentPage: number;
  searchQuery: string;
  statusFilter: string;
}

export async function TeachersTable({ currentPage, searchQuery, statusFilter }: TeachersTableProps) {

  const { data: teachers, totalPages } = await getTeachers(currentPage, 10, searchQuery, statusFilter);

  return (
    <div className="space-y-4">
      <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">

        {/* Header Desktop */}
        <div className="hidden lg:grid grid-cols-12 gap-4 px-8 py-5 border-b border-slate-100 bg-white">
          <div className="col-span-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Professor</div>
          <div className="col-span-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">E-mail</div>
          <div className="col-span-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status</div>
          <div className="col-span-1 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Corrigidas (Mês Atual)</div>
          <div className="col-span-1 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Corrigidas (Total)</div>
          <div className="col-span-1 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Ação</div>
        </div>

        {/* Corpo / Lista */}
        <div className="divide-y divide-slate-100">
          {teachers.length === 0 ? (
            <div className="p-8 text-center text-sm font-bold text-slate-500">
              Nenhum professor encontrado.
            </div>
          ) : (
            teachers.map((teacher) => (
              <div key={teacher.id} className="grid grid-cols-1 lg:grid-cols-12 gap-4 p-5 lg:px-8 lg:py-4 items-center hover:bg-slate-50/50 transition-colors group">

                {/* Professor */}
                <div className="col-span-1 lg:col-span-4 flex items-center gap-4">
                  <Avatar src={teacher.avatar_url} name={teacher.full_name} className="size-10" />

                  <span className="font-bold text-sm hover:underline cursor-pointer">{teacher.full_name}</span>
                </div>

                {/* E-mail */}
                <div className="col-span-1 lg:col-span-3 flex justify-between lg:block">
                  <span className="lg:hidden text-[10px] font-bold text-slate-400 uppercase tracking-widest">E-mail</span>
                  <span className="text-sm font-medium text-slate-500">{teacher.email}</span>
                </div>

                {/* Status */}
                <div className="col-span-1 lg:col-span-2 flex justify-between lg:block">
                  <span className="lg:hidden text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status</span>
                  <span className={`inline-flex px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${teacher.status === "Ativo" || teacher.status === "active"
                    ? "bg-emerald-50 text-emerald-600"
                    : "bg-slate-100 text-slate-500"
                    }`}>
                    {teacher.status === "active" ? "Ativo" : teacher.status}
                  </span>
                </div>

                {/* Corrigidas (Mês Atual) */}
                <div className="col-span-1 lg:col-span-1 flex justify-between lg:justify-center items-center">
                  <span className="lg:hidden text-[10px] font-bold text-slate-400 uppercase tracking-widest">Mês Atual</span>
                  <span className="text-base font-black text-blue-600">{teacher.currentMonth}</span>
                </div>

                {/* Corrigidas (Total) */}
                <div className="col-span-1 lg:col-span-1 flex justify-between lg:justify-center items-center">
                  <span className="lg:hidden text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total</span>
                  <span className="text-base font-black">{teacher.total}</span>
                </div>

                {/* Ações */}
                <div className="col-span-1 lg:col-span-1 flex justify-end mt-2 lg:mt-0 pt-4 lg:pt-0 border-t border-slate-100 lg:border-t-0">
                  <div className="flex items-center gap-1">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors">
                            <Eye className="size-4.5" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent className="bg-slate-900 text-white font-medium text-xs rounded-lg border-none">
                          <p>Ver Detalhes</p>
                        </TooltipContent>
                      </Tooltip>

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors">
                            {(teacher.status === "Ativo" || teacher.status === "active") ? <Ban className="size-4.5" /> : <CheckCircle2 className="size-4.5" />}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent className="bg-slate-900 text-white font-medium text-xs rounded-lg border-none">
                          <p>{(teacher.status === "Ativo" || teacher.status === "active") ? "Bloquear Acesso" : "Desbloquear"}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </div>

              </div>
            ))
          )}
        </div>
      </div>

      {/* Paginação ligada ao total de páginas do banco */}
      <div className={`px-8 py-4 border-t border-slate-100 bg-slate-50 ${totalPages === 1 ? 'hidden' : 'block'}`}>
        <TablePagination totalPages={totalPages} />
      </div>
    </div>
  );
}
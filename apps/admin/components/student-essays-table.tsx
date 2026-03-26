import { Eye, FileEdit } from "lucide-react";
import { Button } from "@repo/ui/components/button";
import { Tooltip, TooltipTrigger, TooltipContent } from "@repo/ui/components/tooltip";
import { TablePagination } from "@/components/table-pagination";
import { getStudentEssays } from "@/app/action/get-students-data";
import { EssayTableFilters } from "./essay-table-filters";

interface StudentEssaysTableProps {
  studentId: string;
  currentPage: number;
  statusFilter: "all" | "done" | "pending";
  dateFilter?: string;
}

export async function StudentEssaysTable({ studentId, currentPage, statusFilter, dateFilter }: StudentEssaysTableProps) {
  const { data: essays, totalPages } = await getStudentEssays(studentId, currentPage, 5, statusFilter, dateFilter);


  return (
    <div className="space-y-6">

      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <h2 className="text-xl font-black text-slate-900">Histórico de redações</h2>
        <EssayTableFilters />
      </div>

      <div className="rounded-4xl border border-slate-200 overflow-hidden shadow-sm bg-white">

        <div className="hidden lg:grid grid-cols-12 gap-4 px-8 py-5 border-b border-slate-100 bg-slate-50/50">
          <div className="col-span-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Redação / Tema</div>
          <div className="col-span-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Data de Envio</div>
          <div className="col-span-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status</div>
          <div className="col-span-1 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Nota Final</div>
          <div className="col-span-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Ação</div>
        </div>

        <div className="divide-y divide-slate-100">
          {essays.map((essay) => (
            <div key={essay.id} className="grid grid-cols-1 lg:grid-cols-12 gap-4 p-5 lg:px-8 lg:py-4 items-center hover:bg-slate-50/50 transition-colors group">
              <div className="col-span-1 lg:col-span-5">
                <p className="font-bold text-[15px] leading-snug">{essay.title}</p>
                <p className="text-sm font-medium text-slate-500 mt-0.5">{essay.theme}</p>
              </div>

              <div className="col-span-1 lg:col-span-2 flex justify-between lg:block items-center">
                <span className="lg:hidden text-[11px] font-bold text-slate-500 uppercase tracking-widest">Data de Envio</span>
                <span className="text-[15px] font-medium">{essay.date}</span>
              </div>

              <div className="col-span-1 lg:col-span-2 flex justify-between items-center">
                <span className="lg:hidden text-[11px] font-bold text-slate-500 uppercase tracking-widest">Status</span>
                <span className={`inline-flex px-3.5 py-1.5 rounded-full text-xs font-bold ${essay.status === 'Corrigido' ? 'bg-green-50 text-green-600' : 'bg-yellow-50 text-yellow-600'
                  }`}>
                  {essay.status}
                </span>
              </div>

              <div className="col-span-1 lg:col-span-1 flex justify-between lg:block items-center">
                <span className="lg:hidden text-[11px] font-bold text-slate-500 uppercase tracking-widest">Nota Final</span>
                <span className={`text-[15px] font-black ${essay.score === '--' ? 'text-slate-400' : 'text-slate-900'}`}>
                  {essay.score}
                </span>
              </div>

              {/* Ação */}
              <div className="col-span-1 lg:col-span-2 flex justify-end mt-2 lg:mt-0 pt-4 lg:pt-0 border-t border-slate-100 lg:border-t-0">
                <div className="flex items-center gap-1">
                  {essay.status === 'Pendente' && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors">
                          <FileEdit className="size-4.5" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent className="bg-slate-900 text-white font-medium text-xs rounded-lg border-none">
                        <p>Corrigir Redação</p>
                      </TooltipContent>
                    </Tooltip>
                  )}

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
                </div>
              </div>

            </div>
          ))}
        </div>

        <div className="px-8 py-4 border-t border-slate-100 bg-slate-50 ">
          <TablePagination totalPages={totalPages} />
        </div>
      </div>
    </div>
  );
}
import { Eye, FileEdit } from "lucide-react";
import { Button } from "@repo/ui/components/button";
import { Tooltip, TooltipTrigger, TooltipContent } from "@repo/ui/components/tooltip";
import { formatDate } from "@repo/utils";
import { StudentEssayItem } from "@/types";
import Link from "next/link";


const essayStatusConfig: Record<"pending" | "correcting" | "corrected" | "returned", { label: string; classes: string }> = {
  corrected: { label: "Corrigido", classes: "bg-green-50 text-green-600" },
  pending: { label: "Pendente", classes: "bg-yellow-50 text-yellow-600" },
  correcting: { label: "Em correção", classes: "bg-blue-50 text-blue-600" },
  returned: { label: "Devolvida", classes: "bg-red-50 text-red-600" },
};
interface StudentEssaysTableRowProps {
  essay: StudentEssayItem;
}

export function StudentEssaysTableRow({ essay }: StudentEssaysTableRowProps) {
  const statusConfig = essayStatusConfig[essay.status as keyof typeof essayStatusConfig]

  const formattedScore = essay.total_score > 0 ? essay.total_score : "--";

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 p-5 lg:px-8 lg:py-4 items-center hover:bg-slate-50/50 transition-colors group">

      <div className="col-span-1 lg:col-span-5">
        <p className="font-bold text-[15px] leading-snug">{essay.title}</p>
        <p className="text-sm font-medium text-slate-500 mt-0.5">{essay.thematic_axis}</p>
      </div>

      <div className="col-span-1 lg:col-span-2 flex justify-between lg:block items-center">
        <span className="lg:hidden text-[11px] font-bold text-slate-500 uppercase tracking-widest">Data de Envio</span>
        <span className="text-[15px] font-medium">{formatDate(essay.created_at, 'numeric')}</span>
      </div>

      <div className="col-span-1 lg:col-span-2 flex justify-between items-center">
        <span className="lg:hidden text-[11px] font-bold text-slate-500 uppercase tracking-widest">Status</span>
        <span className={`inline-flex px-3.5 py-1.5 rounded-full text-xs font-bold ${statusConfig.classes}`}>
          {statusConfig.label}
        </span>
      </div>

      <div className="col-span-1 lg:col-span-1 flex justify-between lg:block items-center">
        <span className="lg:hidden text-[11px] font-bold text-slate-500 uppercase tracking-widest">Nota Final</span>
        <span className={`text-[15px] font-black ${essay.total_score > 0 ? 'text-slate-900' : 'text-slate-400'}`}>
          {formattedScore}
        </span>
      </div>

      <div className="col-span-1 lg:col-span-2 flex justify-end mt-2 lg:mt-0 pt-4 lg:pt-0 border-t border-slate-100 lg:border-t-0">
        <div className="flex items-center gap-1">
          {essay.status === 'pending' && (
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
              <Button asChild disabled={essay.status === 'correcting'} variant="ghost" size="icon" className="h-9 w-9 rounded-full text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors">
                <Link href={`?essayId=${essay.id}`} scroll={false}>
                  <Eye className="size-4.5" />
                </Link>
              </Button>
            </TooltipTrigger>
            <TooltipContent className="bg-slate-900 text-white font-medium text-xs rounded-lg border-none">
              <p>Ver Detalhes</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </div>
    </div>
  );
}
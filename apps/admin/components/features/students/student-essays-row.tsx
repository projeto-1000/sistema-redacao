import { Eye, FileEdit } from "lucide-react";
import { Button } from "@repo/ui/components/button";
import { Tooltip, TooltipTrigger, TooltipContent } from "@repo/ui/components/tooltip";
import { formatDate } from "@repo/utils";
import { StudentEssayItem } from "@/types";
import Link from "next/link";

const essayStatusConfig: Record<
  "pending" | "correcting" | "corrected" | "returned",
  { label: string; classes: string }
> = {
  corrected: { label: "Corrigido", classes: "bg-green-50 text-green-600" },
  pending: { label: "Pendente", classes: "bg-yellow-50 text-yellow-600" },
  correcting: { label: "Em correção", classes: "bg-blue-50 text-blue-600" },
  returned: { label: "Devolvida", classes: "bg-red-50 text-red-600" },
};
interface StudentEssaysTableRowProps {
  essay: StudentEssayItem;
}

export function StudentEssaysTableRow({ essay }: StudentEssaysTableRowProps) {
  const statusConfig = essayStatusConfig[essay.status as keyof typeof essayStatusConfig];

  const formattedScore = essay.total_score > 0 ? essay.total_score : "--";

  return (
    <div className="group grid grid-cols-1 items-center gap-4 p-5 transition-colors hover:bg-slate-50/50 lg:grid-cols-12 lg:px-8 lg:py-4">
      <div className="col-span-1 lg:col-span-5">
        <p className="text-[15px] leading-snug font-bold">{essay.title}</p>
        <p className="mt-0.5 text-sm font-medium text-slate-500">{essay.thematic_axis}</p>
      </div>

      <div className="col-span-1 flex items-center justify-between lg:col-span-2 lg:block">
        <span className="text-[11px] font-bold tracking-widest text-slate-500 uppercase lg:hidden">
          Data de Envio
        </span>
        <span className="text-[15px] font-medium">{formatDate(essay.created_at, "numeric")}</span>
      </div>

      <div className="col-span-1 flex items-center justify-between lg:col-span-2">
        <span className="text-[11px] font-bold tracking-widest text-slate-500 uppercase lg:hidden">
          Status
        </span>
        <span
          className={`inline-flex rounded-full px-3.5 py-1.5 text-xs font-bold ${statusConfig.classes}`}
        >
          {statusConfig.label}
        </span>
      </div>

      <div className="col-span-1 flex items-center justify-between lg:col-span-1 lg:block">
        <span className="text-[11px] font-bold tracking-widest text-slate-500 uppercase lg:hidden">
          Nota Final
        </span>
        <span
          className={`text-[15px] font-black ${essay.total_score > 0 ? "text-slate-900" : "text-slate-400"}`}
        >
          {formattedScore}
        </span>
      </div>

      <div className="col-span-1 mt-2 flex justify-end border-t border-slate-100 pt-4 lg:col-span-2 lg:mt-0 lg:border-t-0 lg:pt-0">
        <div className="flex items-center gap-1">
          {essay.status === "pending" && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 rounded-full text-slate-400 transition-colors hover:bg-emerald-50 hover:text-emerald-600"
                >
                  <FileEdit className="size-4.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent className="rounded-lg border-none bg-slate-900 text-xs font-medium text-white">
                <p>Corrigir Redação</p>
              </TooltipContent>
            </Tooltip>
          )}

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                asChild={essay.status === "corrected"}
                disabled={essay.status === "correcting"}
                variant="ghost"
                size="icon"
                className="h-9 w-9 rounded-full text-slate-400 transition-colors hover:bg-blue-50 hover:text-blue-600"
              >
                <Link href={`?essayId=${essay.id}`} scroll={false}>
                  <Eye className="size-4.5" />
                </Link>
              </Button>
            </TooltipTrigger>
            <TooltipContent className="rounded-lg border-none bg-slate-900 text-xs font-medium text-white">
              <p>Ver Detalhes</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </div>
    </div>
  );
}


import { Essay } from "@repo/types";
import { ThemeBadge } from "@repo/ui/components/theme-badge";
import { formatDate } from "@repo/utils";
// import type { Essay } from "@/types"; // Ideal mover a tipagem para um arquivo global
import { Calendar1Icon } from "lucide-react";

interface EssayCardProps {
  essay: Essay;
}

export function EssayCard({ essay }: EssayCardProps) {
  const isCorrected = essay.status === "done";
  const isPending = essay.status === "pending";
  const isDraft = essay.status === "draft";

  return (
    <div className="bg-white rounded-3xl border border-slate-200 p-6 flex flex-col justify-between h-full shadow-sm hover:shadow-md transition-shadow">
      <div>
        <div className="flex justify-between items-start mb-4">
          <ThemeBadge
            value={essay.thematic_axis}
            className="inline-block px-2 py-1 text-[10px] font-bold uppercase tracking-widest"
          />
        </div>

        <h3 className="font-bold text-lg leading-snug mb-3 line-clamp-2">
          {essay.title}
        </h3>

        <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
          <Calendar1Icon className="size-3.5" />
          {formatDate(essay.submission_date)}
        </div>
      </div>

      <div className="flex items-end justify-between pt-4 border-t border-slate-50">
        <div className="flex flex-col gap-1">
          {isCorrected && (
            <div className="flex items-center gap-1.5 text-xs font-bold text-green-600">
              <span className="size-2 rounded-full bg-green-500" />
              Corrigida
            </div>
          )}
          {isPending && (
            <div className="flex items-center gap-1.5 text-xs font-bold text-[#EBC84C]">
              <span className="size-2 rounded-full bg-[#EBC84C]" />
              Pendente
            </div>
          )}
          {isDraft && (
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400">
              <span className="size-2 rounded-full bg-slate-300" />
              Rascunho
            </div>
          )}
        </div>

        {isCorrected ? (
          <div className="text-right">
            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Nota Final
            </span>
            <span className="text-2xl font-extrabold text-foreground">
              {essay.total_score ?? "---"}
            </span>
          </div>
        ) : (
          <div className="text-right opacity-50">
            <span className="block text-[10px] font-bold text-slate-300 uppercase tracking-wider">Nota Final</span>
            <span className="text-xl font-bold text-slate-300">--</span>
          </div>
        )}
      </div>
    </div>
  );
}
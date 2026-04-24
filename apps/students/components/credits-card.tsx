
import { Button } from "@repo/ui/components/button";
import { Coins, Plus } from "lucide-react";

interface TeacherCreditsCardProps {
  credits: number;
}

export function CreditsCard({ credits }: TeacherCreditsCardProps) {
  return (
    <div className="flex items-center gap-4 p-3 pr-4 bg-white border border-slate-200 rounded-2xl shadow-sm w-full md:w-auto">
      <div className="p-2.5 bg-[#FFF9E6] text-[#EBC84C] rounded-xl shrink-0">
        <Coins className="size-5" />
      </div>

      <div className="flex flex-col pr-4 border-r border-slate-100">
        <span className="font-bold text-slate-400 text-[10px] uppercase tracking-wider mb-0.5">
          Créditos
        </span>
        <div className="flex items-baseline gap-1">
          <span className="text-2xl font-extrabold tracking-tight leading-none">
            {credits}
          </span>
          <span className="text-xs font-medium text-slate-400">
            disponíveis
          </span>
        </div>
      </div>

      <Button
        variant="ghost"
        className="h-8 px-3 text-xs font-bold text-slate-600 hover:text-slate-900 rounded-lg shrink-0"
      >
        Adicionar
        <Plus className="size-3.5 ml-1" />
      </Button>

    </div>
  );
}
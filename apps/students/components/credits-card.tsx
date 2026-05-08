
import { Button } from "@repo/ui/components/button";
import { Coins, Plus } from "lucide-react";

interface TeacherCreditsCardProps {
  credits: number;
}

export function CreditsCard({ credits }: TeacherCreditsCardProps) {
  return (
    <div className="flex items-center md:gap-4 p-3 bg-white border border-slate-200 rounded-2xl shadow-sm w-fit md:w-auto justify-between">
      <div className="flex gap-2 md:gap-4">
        <div className="p-2.5  bg-[#FFF9E6] text-[#EBC84C] rounded-xl">
          <Coins className="size-5" />
        </div>
        <div className="flex flex-col">
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
      </div>

      <Button
        variant="ghost"
        className="h-8 text-xs font-bold text-slate-600 hover:text-slate-900 rounded-lg"
      >
        Adicionar
        <Plus className="size-3.5 ml-1" />
      </Button>

    </div>
  );
}
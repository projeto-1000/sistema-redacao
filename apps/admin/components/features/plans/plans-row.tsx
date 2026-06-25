'use client'

import { updatePlanStatus } from "@/app/actions/plans";
import { Plans } from "@repo/types"
import { Button } from "@repo/ui/components/button";
import { formatCurrency, getCycleInfo } from "@repo/utils";
import { Power, PowerOff } from "lucide-react";
import { useTransition } from "react";
import { EditPlanDialog } from "./edit-plan-dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@repo/ui/components/tooltip";

interface PlansRowProps {
  plan: Plans
}

export default function PlansRow({ plan }: PlansRowProps) {
  const cycleInfo = getCycleInfo(plan.interval, plan.interval_count);
  const [isPending, startTransition] = useTransition();

  const handleUpdateStatus = () => {
    startTransition(async () => {
      const result = await updatePlanStatus(plan.id, plan.is_active);
      if (!result.success) {
        alert(result.error);
      }
    });
  };


  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-2 sm:gap-3 lg:gap-4 px-4 sm:px-8 py-5 items-center hover:bg-slate-50 transition-colors group">
      <div className="lg:col-span-3 flex flex-col" >
        <span className="text-sm font-bold text-slate-700">{plan.name}</span>
        <span className="text-sm text-slate-500">
          {plan.credits_included} redações{cycleInfo.suffix}
        </span>
      </div>

      <div className="lg:col-span-3 mt-2 lg:mt-0">
        <span className="lg:hidden text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">
          Tipo
        </span>
        <p className="text-sm font-medium leading-snug line-clamp-2" title={`${plan.interval_count} ${plan.interval}`}>
          {cycleInfo.label}
        </p>
      </div>

      <div className="lg:col-span-2 mt-2 lg:mt-0">
        <span className="lg:hidden text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">
          Status
        </span>
        <div className="flex items-center gap-2">
          <span
            className={`inline-flex px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider ${plan.is_active
              ? "bg-emerald-50 text-emerald-600"
              : "bg-slate-100 text-slate-500"
              }`}
          >
            {plan.is_active ? "Ativo" : "Inativo"}
          </span>
        </div>
      </div>

      <div className="lg:col-span-2 flex items-baseline  lg:justify-start gap-1 mt-2 lg:mt-0">
        <span className="lg:hidden text-[10px] font-bold text-slate-400 uppercase tracking-widest block mr-1">
          Valor:
        </span>
        <span className="text-sm font-bold">
          {formatCurrency(plan.price)}
          <span className="text-xs font-normal text-slate-500 ml-0.5">
            {cycleInfo.suffix}
          </span>
        </span>
      </div>

      <div className="col-span-2 flex justify-end gap-2">
        <EditPlanDialog plan={plan} />

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleUpdateStatus}
                disabled={isPending}
                className={`size-8 rounded-lg ${plan.is_active ? 'text-red-400 hover:text-red-600 hover:bg-red-50' : 'text-emerald-500 hover:text-emerald-700 hover:bg-emerald-50'}`}
                isLoading={isPending}
                loadingText={plan.is_active ? "Desativando..." : "Ativando..."}
              >
                {plan.is_active ? (
                  <PowerOff className="size-4" />
                ) : (
                  <Power className="size-4" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent className="bg-slate-800 text-white font-semibold text-xs border-none rounded-lg">
              <p>{plan.is_active ? "Desativar Plano" : "Ativar Plano"}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

    </div>
  )
}
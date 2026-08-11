"use client";

import { setPlanStatus } from "@/app/actions/plans";
import { Plans } from "@repo/types";
import { Button } from "@repo/ui/components/button";
import { formatCurrency, getCycleInfo } from "@repo/utils";
import { Power, PowerOff } from "lucide-react";
import { useTransition } from "react";
import { EditPlanDialog } from "./edit-plan-dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@repo/ui/components/tooltip";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@repo/ui/components/alert-dialog";
import { toast } from "sonner";

interface PlansRowProps {
  plan: Plans;
}

export default function PlansRow({ plan }: PlansRowProps) {
  const cycleInfo = getCycleInfo(plan.interval, plan.interval_count);
  const [isPending, startTransition] = useTransition();

  const handleUpdateStatus = () => {
    startTransition(async () => {
      const nextStatus = !plan.is_active;
      const result = await setPlanStatus(plan.id, nextStatus);

      if (!result.success) {
        toast.error("Não foi possível alterar o status", {
          description: result.error,
        });
        return;
      }

      toast.success(nextStatus ? "Plano reativado" : "Plano desativado");
    });
  };

  return (
    <div className="group grid grid-cols-1 items-center gap-2 px-4 py-5 transition-colors hover:bg-slate-50 sm:gap-3 sm:px-8 lg:grid-cols-12 lg:gap-4">
      <div className="flex flex-col lg:col-span-3">
        <span className="text-sm font-bold text-slate-700">{plan.name}</span>
        <span className="text-sm text-slate-500">
          {plan.credits_included} redações{cycleInfo.suffix}
        </span>
      </div>

      <div className="mt-2 lg:col-span-3 lg:mt-0">
        <span className="mb-1 block text-[10px] font-bold tracking-widest text-slate-400 uppercase lg:hidden">
          Tipo
        </span>
        <p
          className="line-clamp-2 text-sm leading-snug font-medium"
          title={`${plan.interval_count} ${plan.interval}`}
        >
          {cycleInfo.label}
        </p>
      </div>

      <div className="mt-2 lg:col-span-2 lg:mt-0">
        <span className="mb-1 block text-[10px] font-bold tracking-widest text-slate-400 uppercase lg:hidden">
          Status
        </span>
        <div className="flex items-center gap-2">
          <span
            className={`inline-flex rounded-md px-2.5 py-1 text-[10px] font-black tracking-wider uppercase ${
              plan.is_active ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-500"
            }`}
          >
            {plan.is_active ? "Ativo" : "Inativo"}
          </span>
        </div>
      </div>

      <div className="mt-2 flex items-baseline gap-1 lg:col-span-2 lg:mt-0 lg:justify-start">
        <span className="mr-1 block text-[10px] font-bold tracking-widest text-slate-400 uppercase lg:hidden">
          Valor:
        </span>
        <span className="text-sm font-bold">
          {formatCurrency(plan.price)}
          <span className="ml-0.5 text-xs font-normal text-slate-500">{cycleInfo.suffix}</span>
        </span>
      </div>

      <div className="col-span-2 flex justify-end gap-2">
        <EditPlanDialog plan={plan} />

        <AlertDialog>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    disabled={isPending}
                    className={`size-8 rounded-lg ${plan.is_active ? "text-red-400 hover:bg-red-50 hover:text-red-600" : "text-emerald-500 hover:bg-emerald-50 hover:text-emerald-700"}`}
                    isLoading={isPending}
                    loadingText={plan.is_active ? "Desativando..." : "Reativando..."}
                  >
                    {plan.is_active ? (
                      <PowerOff className="size-4" />
                    ) : (
                      <Power className="size-4" />
                    )}
                  </Button>
                </AlertDialogTrigger>
              </TooltipTrigger>
              <TooltipContent className="rounded-lg border-none bg-slate-800 text-xs font-semibold text-white">
                <p>{plan.is_active ? "Desativar Plano" : "Reativar Plano"}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <AlertDialogContent className="rounded-3xl border-none">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-xl font-black">
                {plan.is_active ? "Desativar plano?" : "Reativar plano?"}
              </AlertDialogTitle>
              <AlertDialogDescription className="font-medium text-slate-500">
                {plan.is_active
                  ? `O plano ${plan.name} deixará de aparecer para novas compras. Assinaturas e histórico serão preservados.`
                  : `O plano ${plan.name} voltará a ficar disponível para novas compras.`}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="gap-2">
              <AlertDialogCancel className="rounded-xl border-none bg-slate-100 font-bold text-slate-600 hover:bg-slate-200">
                Cancelar
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleUpdateStatus}
                className={`rounded-xl font-bold text-white ${plan.is_active ? "bg-red-600 hover:bg-red-700" : "bg-emerald-600 hover:bg-emerald-700"}`}
              >
                {plan.is_active ? "Desativar" : "Reativar"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}

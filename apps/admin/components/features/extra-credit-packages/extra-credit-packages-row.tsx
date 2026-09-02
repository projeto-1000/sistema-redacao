"use client";

import { setExtraCreditPackageStatus } from "@/app/actions/extra-credit-packages";
import type { ExtraCreditPackage } from "@repo/types";
import { Button } from "@repo/ui/components/button";
import { formatCurrency } from "@repo/utils";
import { Power, PowerOff } from "lucide-react";
import { useTransition } from "react";
import { EditExtraCreditPackageDialog } from "./edit-extra-credit-package-dialog";
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

interface ExtraCreditPackagesRowProps {
  packageItem: ExtraCreditPackage;
}

export default function ExtraCreditPackagesRow({
  packageItem,
}: ExtraCreditPackagesRowProps) {
  const [isPending, startTransition] = useTransition();

  const handleUpdateStatus = () => {
    startTransition(async () => {
      const nextStatus = !packageItem.is_active;

      const result = await setExtraCreditPackageStatus(
        packageItem.id,
        nextStatus
      );

      if (!result.success) {
        toast.error("Não foi possível alterar o status", {
          description: result.error,
        });
        return;
      }

      toast.success(
        nextStatus ? "Pacote reativado" : "Pacote desativado"
      );
    });
  };

  return (
    <div className="group grid grid-cols-1 items-center gap-2 px-4 py-5 transition-colors hover:bg-slate-50 sm:gap-3 sm:px-8 lg:grid-cols-12 lg:gap-4">
      <div className="flex flex-col lg:col-span-4">
        <span className="text-sm font-bold text-slate-700">
          {packageItem.name}
        </span>

        {packageItem.description ? (
          <span
            className="line-clamp-2 text-sm text-slate-500"
            title={packageItem.description}
          >
            {packageItem.description}
          </span>
        ) : (
          <span className="text-sm text-slate-400">
            Sem descrição
          </span>
        )}
      </div>

      <div className="mt-2 lg:col-span-2 lg:mt-0">
        <span className="mb-1 block text-[10px] font-bold tracking-widest text-slate-400 uppercase lg:hidden">
          Créditos
        </span>

        <span className="text-sm font-bold text-slate-700">
          {packageItem.credits_amount}
          {packageItem.credits_amount === 1 ? " crédito" : " créditos"}
        </span>
      </div>

      <div className="mt-2 lg:col-span-2 lg:mt-0">
        <span className="mb-1 block text-[10px] font-bold tracking-widest text-slate-400 uppercase lg:hidden">
          Status
        </span>

        <span
          className={`inline-flex rounded-md px-2.5 py-1 text-[10px] font-black tracking-wider uppercase ${packageItem.is_active
            ? "bg-emerald-50 text-emerald-600"
            : "bg-slate-100 text-slate-500"
            }`}
        >
          {packageItem.is_active ? "Ativo" : "Inativo"}
        </span>
      </div>

      <div className="mt-2 flex items-baseline gap-1 lg:col-span-2 lg:mt-0">
        <span className="mr-1 block text-[10px] font-bold tracking-widest text-slate-400 uppercase lg:hidden">
          Valor:
        </span>

        <span className="text-sm font-bold">
          {formatCurrency(packageItem.price_cents)}
        </span>
      </div>

      <div className="col-span-2 flex justify-end gap-2">
        <EditExtraCreditPackageDialog packageItem={packageItem} />

        <AlertDialog>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    disabled={isPending}
                    className={`size-8 rounded-lg ${packageItem.is_active
                      ? "text-red-400 hover:bg-red-50 hover:text-red-600"
                      : "text-emerald-500 hover:bg-emerald-50 hover:text-emerald-700"
                      }`}
                    isLoading={isPending}
                    loadingText={
                      packageItem.is_active
                        ? "Desativando..."
                        : "Reativando..."
                    }
                  >
                    {packageItem.is_active ? (
                      <PowerOff className="size-4" />
                    ) : (
                      <Power className="size-4" />
                    )}
                  </Button>
                </AlertDialogTrigger>
              </TooltipTrigger>

              <TooltipContent className="rounded-lg border-none bg-slate-800 text-xs font-semibold text-white">
                <p>
                  {packageItem.is_active
                    ? "Desativar pacote"
                    : "Reativar pacote"}
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <AlertDialogContent className="rounded-3xl border-none">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-xl font-black">
                {packageItem.is_active
                  ? "Desativar pacote?"
                  : "Reativar pacote?"}
              </AlertDialogTitle>

              <AlertDialogDescription className="font-medium text-slate-500">
                {packageItem.is_active
                  ? `O pacote ${packageItem.name} deixará de ficar disponível para novas compras. O histórico de compras será preservado.`
                  : `O pacote ${packageItem.name} voltará a ficar disponível para novas compras.`}
              </AlertDialogDescription>
            </AlertDialogHeader>

            <AlertDialogFooter className="gap-2">
              <AlertDialogCancel className="rounded-xl border-none bg-slate-100 font-bold text-slate-600 hover:bg-slate-200">
                Cancelar
              </AlertDialogCancel>

              <AlertDialogAction
                onClick={handleUpdateStatus}
                className={`rounded-xl font-bold text-white ${packageItem.is_active
                  ? "bg-red-600 hover:bg-red-700"
                  : "bg-emerald-600 hover:bg-emerald-700"
                  }`}
              >
                {packageItem.is_active ? "Desativar" : "Reativar"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
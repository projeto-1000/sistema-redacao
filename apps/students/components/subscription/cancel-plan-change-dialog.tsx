"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { cancelScheduledPlanChange } from "@/app/actions/plan-change";

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@repo/ui/components/alert-dialog";
import { Button } from "@repo/ui/components/button";
import { formatDate } from "@repo/utils";

interface CancelPlanChangeDialogProps {
  currentPlanName: string;
  pendingPlanName: string;
  effectiveAt: string;
}

export function CancelPlanChangeDialog({
  currentPlanName,
  pendingPlanName,
  effectiveAt,
}: CancelPlanChangeDialogProps) {
  const router = useRouter();

  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(
    null
  );
  const [isPending, startTransition] =
    useTransition();

  function handleOpenChange(nextOpen: boolean) {
    if (isPending) {
      return;
    }

    setOpen(nextOpen);

    if (!nextOpen) {
      setError(null);
    }
  }

  function handleCancelPlanChange() {
    setError(null);

    startTransition(async () => {
      const result =
        await cancelScheduledPlanChange();

      if (!result.success) {
        setError(result.message);
        return;
      }

      setOpen(false);
      router.refresh();
    });
  }

  return (
    <AlertDialog
      open={open}
      onOpenChange={handleOpenChange}
    >
      <AlertDialogTrigger asChild>
        <Button
          variant="outline"
          className="h-11 w-full rounded-xl font-medium md:w-auto"
        >
          Cancelar alteração
        </Button>
      </AlertDialogTrigger>

      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            Cancelar alteração de plano?
          </AlertDialogTitle>

          <AlertDialogDescription>
            A alteração para o plano{" "}
            <strong>{pendingPlanName}</strong>,
            agendada para{" "}
            <strong>
              {formatDate(effectiveAt, "numeric")}
            </strong>
            , será cancelada. Você continuará no
            plano{" "}
            <strong>{currentPlanName}</strong>.
          </AlertDialogDescription>
        </AlertDialogHeader>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3">
            <p className="text-sm font-medium text-red-700">
              {error}
            </p>
          </div>
        )}

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>
            Voltar
          </AlertDialogCancel>

          <Button
            variant="destructive"
            disabled={isPending}
            onClick={handleCancelPlanChange}
            isLoading={isPending}
            loadingText="Cancelando..."
          >
            Cancelar alteração
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
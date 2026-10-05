"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { reactivateScheduledSubscription } from "@/app/actions/subscription-cancellation";

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

interface ReactivateSubscriptionDialogProps {
  planName: string;
  effectiveAt: string;
}

export function ReactivateSubscriptionDialog({
  planName,
  effectiveAt,
}: ReactivateSubscriptionDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleOpenChange(nextOpen: boolean) {
    if (isPending) {
      return;
    }

    setOpen(nextOpen);

    if (!nextOpen) {
      setError(null);
    }
  }

  function handleReactivation() {
    setError(null);

    startTransition(async () => {
      const result = await reactivateScheduledSubscription();

      if (!result.success) {
        setError(result.message);
        return;
      }

      setOpen(false);
      router.refresh();
    });
  }

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogTrigger asChild>
        <Button className="h-11 w-full rounded-xl font-medium md:w-auto">
          Desfazer cancelamento
        </Button>
      </AlertDialogTrigger>

      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Desfazer cancelamento?</AlertDialogTitle>

          <AlertDialogDescription className="space-y-3">
            <span className="block">
              Sua assinatura do plano <strong>{planName}</strong> continuará ativa e voltará a ser
              renovada normalmente.
            </span>

            <span className="block">
              Nenhuma cobrança será feita agora. A próxima cobrança está programada para{" "}
              <strong>{formatDate(effectiveAt, "numeric")}</strong>.
            </span>
          </AlertDialogDescription>
        </AlertDialogHeader>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3">
            <p className="text-sm font-medium text-red-700">{error}</p>
          </div>
        )}

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Manter cancelamento</AlertDialogCancel>

          <Button
            disabled={isPending}
            onClick={handleReactivation}
            isLoading={isPending}
            loadingText="Reativando..."
          >
            Confirmar reativação
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

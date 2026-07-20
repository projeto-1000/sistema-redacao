"use client";

import {
  useState,
  useTransition,
} from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";

import { requestSubscriptionCancellation } from "@/app/actions/subscription-cancellation";
import {
  subscriptionCancellationReasons,
  type SubscriptionCancellationReason,
} from "@/types/subscription-cancellation";

import { Button } from "@repo/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@repo/ui/components/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/select";
import { Textarea } from "@repo/ui/components/textarea";
import { formatDate } from "@repo/utils";

interface CancelSubscriptionDialogProps {
  planName: string;
  effectiveAt: string;
}

type DialogState =
  | "confirmation"
  | "success";

export function CancelSubscriptionDialog({
  planName,
  effectiveAt,
}: CancelSubscriptionDialogProps) {
  const router = useRouter();


  const [open, setOpen] = useState(false);
  const [details, setDetails] = useState("");

  const [dialogState, setDialogState] =
    useState<DialogState>("confirmation");

  const [reason, setReason] =
    useState<SubscriptionCancellationReason | null>(
      null
    );

  const [errorMessage, setErrorMessage] =
    useState<string | null>(null);

  const [confirmedEffectiveAt, setConfirmedEffectiveAt] =
    useState(effectiveAt);

  const [isPending, startTransition] =
    useTransition();

  function resetDialog() {
    setDialogState("confirmation");
    setReason(null);
    setDetails("");
    setErrorMessage(null);
    setConfirmedEffectiveAt(effectiveAt);
  }

  function handleOpenChange(nextOpen: boolean) {
    if (isPending) {
      return;
    }

    setOpen(nextOpen);

    if (!nextOpen) {
      setTimeout(resetDialog, 300);
    }
  }

  function handleCancellation() {
    setErrorMessage(null);

    startTransition(async () => {
      const result =
        await requestSubscriptionCancellation({
          reason,
          details:
            reason === "other" && details.trim()
              ? details.trim()
              : undefined,
        });

      if (!result.success) {
        setErrorMessage(result.message);
        return;
      }

      setConfirmedEffectiveAt(
        result.effectiveAt
      );

      setDialogState("success");
      router.refresh();
    });
  }

  function handleFinish() {
    setOpen(false);
    setTimeout(resetDialog, 600);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={handleOpenChange}
    >
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="h-11 w-full rounded-xl border-slate-300 text-slate-700 md:w-auto"
        >
          Cancelar assinatura
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[500px]">
        {dialogState === "confirmation" ? (
          <>
            <DialogHeader>
              <div className="mb-2 flex size-11 items-center justify-center rounded-full bg-amber-100">
                <AlertTriangle className="size-5 text-amber-700" />
              </div>

              <DialogTitle className="text-2xl font-bold">
                Cancelar assinatura?
              </DialogTitle>

              <DialogDescription className="leading-relaxed text-slate-500">
                Você está cancelando o plano{" "}
                <strong className="text-slate-700">
                  {planName}
                </strong>
                .
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-5 py-2">
              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
                <p className="text-sm font-bold text-amber-950">
                  Você poderá usar o plano até{" "}
                  {formatDate(
                    effectiveAt,
                    "numeric"
                  )}
                  .
                </p>

                <p className="mt-2 text-sm leading-relaxed text-amber-900/80">
                  Depois dessa data, não haverá nova cobrança e os créditos restantes do plano expirarão.
                  Créditos adicionais serão mantidos.
                </p>
              </div>

              <div>
                <label
                  htmlFor="cancellation-reason"
                  className="mb-2 block text-sm font-bold text-slate-800"
                >
                  Motivo do cancelamento{" "}
                  <span className="font-normal text-slate-400">
                    (opcional)
                  </span>
                </label>

                <Select
                  value={reason ?? "not_informed"}
                  disabled={isPending}
                  onValueChange={(value) => {
                    const selectedReason =
                      value === "not_informed"
                        ? null
                        : (value as SubscriptionCancellationReason);

                    setReason(selectedReason);

                    if (selectedReason !== "other") {
                      setDetails("");
                    }
                  }}
                >
                  <SelectTrigger
                    id="cancellation-reason"
                    className="h-11 w-full rounded-xl border-slate-200 bg-white text-slate-700"
                  >
                    <SelectValue placeholder="Selecione um motivo" />
                  </SelectTrigger>

                  <SelectContent>
                    <SelectItem value="not_informed">
                      Prefiro não informar
                    </SelectItem>

                    {subscriptionCancellationReasons.map(
                      (option) => (
                        <SelectItem
                          key={option.value}
                          value={option.value}
                        >
                          {option.label}
                        </SelectItem>
                      )
                    )}
                  </SelectContent>
                </Select>

                {reason === "other" && (
                  <div className="mt-3">
                    <label
                      htmlFor="cancellation-details"
                      className="mb-2 block text-sm font-bold text-slate-800"
                    >
                      Conte o motivo {" "}
                      <span className="font-normal text-slate-400">
                        (opcional)
                      </span>
                    </label>

                    <Textarea
                      id="cancellation-details"
                      value={details}
                      maxLength={500}
                      disabled={isPending}
                      onChange={(event) =>
                        setDetails(event.target.value)
                      }
                      placeholder="Conte um pouco mais sobre sua decisão."
                      className="min-h-24 resize-none rounded-xl"
                    />

                    <p className="mt-1 text-right text-xs text-slate-400">
                      {details.length}/500
                    </p>
                  </div>
                )}
              </div>

              {errorMessage && (
                <div
                  role="alert"
                  className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700"
                >
                  {errorMessage}
                </div>
              )}
            </div>

            <DialogFooter className="gap-2 sm:gap-3">
              <Button
                type="button"
                variant="outline"
                disabled={isPending}
                onClick={() =>
                  handleOpenChange(false)
                }
                className="h-11 rounded-xl"
              >
                Manter assinatura
              </Button>

              <Button
                type="button"
                variant="destructive"
                disabled={isPending}
                onClick={handleCancellation}
                className="h-11 rounded-xl bg-destructive! text-white"
                isLoading={isPending}
                loadingText="Cancelando..."
              >
                Confirmar cancelamento
              </Button>
            </DialogFooter>
          </>
        ) : (
          <div>
            <div className="flex flex-col items-center py-4 text-center">
              <div className="mb-5 flex size-16 items-center justify-center rounded-full bg-emerald-100">
                <CheckCircle2 className="size-9 text-emerald-700" />
              </div>

              <h2 className="text-2xl font-bold">
                Cancelamento agendado
              </h2>

              <p className="mt-3 max-w-sm text-sm leading-relaxed text-slate-500">
                Sua assinatura ficará disponível até{" "}
                <strong className="text-slate-700">
                  {formatDate(
                    confirmedEffectiveAt,
                    "numeric"
                  )}
                </strong>
                . Depois disso, não haverá uma nova
                cobrança.
              </p>


            </div>
            <Button
              type="button"
              onClick={handleFinish}
              className="h-11 w-full rounded-xl"
            >
              Entendi
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
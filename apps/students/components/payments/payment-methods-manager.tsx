"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  CreditCard,
  Loader2,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

import {
  removePaymentCard,
  setDefaultPaymentCard,
} from "@/app/actions/payment-methods";
import type { ManagedPaymentCard } from "@/types";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@repo/ui/components/alert-dialog";
import { Badge } from "@repo/ui/components/badge";
import { Button } from "@repo/ui/components/button";
import { cn } from "@repo/ui/lib/utils";

interface PaymentMethodsManagerProps {
  cards: ManagedPaymentCard[];
  hasActiveCardSubscription: boolean;
}

function formatBrand(brand: string | null) {
  if (!brand) return "Cartão";

  return brand.charAt(0).toUpperCase() + brand.slice(1).toLowerCase();
}

function formatExpiration(month: number | null, year: number | null) {
  if (!month || !year) return "Validade não informada";

  return `${String(month).padStart(2, "0")}/${String(year).slice(-2)}`;
}

export function PaymentMethodsManager({
  cards,
}: PaymentMethodsManagerProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [removingCard, setRemovingCard] =
    useState<ManagedPaymentCard | null>(null);
  const [pendingAction, setPendingAction] = useState<
    "add" | "set-default" | "remove" | null
  >(null);

  const [pendingCardId, setPendingCardId] = useState<string | null>(null);

  function handleSetDefault(cardId: string) {
    setPendingAction("set-default");
    setPendingCardId(cardId);

    startTransition(async () => {
      const result = await setDefaultPaymentCard(cardId);

      if (result.success) {
        toast.success(result.message);
        router.refresh();
      } else {
        toast.error(result.message);
      }

      setPendingAction(null);
      setPendingCardId(null);
    });
  }

  function handleRemove() {
    if (!removingCard) return;

    const cardId = removingCard.id;
    setPendingAction("remove");
    setPendingCardId(cardId);

    startTransition(async () => {
      const result = await removePaymentCard(cardId);

      if (result.success) {
        toast.success(result.message);
        setRemovingCard(null);
        router.refresh();
      } else {
        toast.error(result.message);
      }

      setPendingAction(null);
      setPendingCardId(null);
    });
  }

  return (
    <>
      {cards.length === 0 ? (
        <div className="flex min-h-64 flex-col items-center justify-center rounded-3xl border-2 border-dashed border-slate-200 bg-white p-10 text-center shadow-sm">
          <div className="mb-4 flex size-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
            <CreditCard className="size-6" />
          </div>

          <h2 className="text-xl font-extrabold text-slate-800">
            Nenhum cartão salvo
          </h2>

          <p className="mt-2 max-w-md text-sm font-medium leading-relaxed text-slate-500">
            Adicione um cartão para usá-lo nas suas compras e, quando escolher,
            nas próximas renovações da assinatura.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {cards.map((card) => {
            const isSettingDefault =
              isPending &&
              pendingAction === "set-default" &&
              pendingCardId === card.id;

            const isRemoving =
              isPending &&
              pendingAction === "remove" &&
              pendingCardId === card.id;
            const isHighlighted = card.isDefault || card.isUsedForSubscription;

            return (
              <div
                key={card.id}
                className={cn(
                  "overflow-hidden rounded-3xl border bg-white shadow-sm transition-all",
                  card.isDefault
                    ? "border-primary shadow-[0_0_0_1px_rgba(250,190,20,0.12),0_10px_30px_rgba(15,23,42,0.06)]"
                    : "border-slate-200 hover:border-slate-300 hover:shadow-md"
                )}
              >
                <div
                  className={cn(
                    "flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6 bg-white/10 hover:bg-white transition",
                    isHighlighted && "bg-white"
                  )}
                >
                  <div className="flex min-w-0 items-center gap-4">
                    <div
                      className={cn(
                        "flex size-12 shrink-0 items-center justify-center rounded-2xl",
                        isHighlighted
                          ? "bg-primary/15 text-primary"
                          : "bg-slate-100 text-slate-500"
                      )}
                    >
                      <CreditCard className="size-5" />
                    </div>

                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-base font-extrabold text-slate-800">
                          {formatBrand(card.brand)} •••• {card.lastFourDigits}
                        </p>

                        {card.isDefault ? (
                          <Badge className="rounded-lg px-2 py-1 text-[10px] font-extrabold uppercase tracking-wide">
                            Padrão
                          </Badge>
                        ) : null}
                      </div>

                      <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm font-medium text-slate-500">
                        <span>
                          Validade {formatExpiration(card.expMonth, card.expYear)}
                        </span>

                        {card.holderName ? (
                          <>
                            <span
                              aria-hidden
                              className="hidden size-1 rounded-full bg-slate-300 sm:block"
                            />
                            <span className="truncate uppercase">
                              {card.holderName}
                            </span>
                          </>
                        ) : null}
                      </div>
                    </div>
                  </div>

                  <div className="flex shrink-0 flex-wrap items-center gap-2 sm:justify-end">
                    {!card.isDefault ? (
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-9 w-[122px] rounded-lg px-3 text-xs font-bold"
                        disabled={isPending}
                        onClick={() => handleSetDefault(card.id)}
                      >
                        {isSettingDefault ? (
                          <Loader2 className="size-4 animate-spin" />
                        ) : (
                          "Tornar padrão"
                        )}
                      </Button>
                    ) : null}

                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-9 rounded-lg px-2.5 text-xs font-semibold text-slate-500 hover:bg-red-50 hover:text-destructive"
                      disabled={isPending || card.isUsedForSubscription}
                      onClick={() => setRemovingCard(card)}
                      title={
                        card.isUsedForSubscription
                          ? "Torne outro cartão padrão antes de remover este cartão."
                          : undefined
                      }
                      isLoading={isRemoving}
                    >
                      <Trash2 className="mr-1.5 size-3.5" />
                      Remover
                    </Button>
                  </div>
                </div>

                {card.isUsedForSubscription ? (
                  <div className="flex items-start gap-3 border-t border-blue-100 bg-blue-50/70 px-5 py-3.5 text-sm font-semibold leading-relaxed text-blue-800">
                    <ShieldCheck className="mt-0.5 size-4 shrink-0 text-blue-600" />

                    <span>
                      Este cartão será usado nas próximas renovações da sua assinatura.
                    </span>
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      )}

      <div className="mt-8 rounded-3xl border border-slate-200 bg-slate-100 px-6 py-5">
        <div className="flex items-start gap-4">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-white text-slate-700 shadow-sm ring-1 ring-slate-200">
            <ShieldCheck className="size-5 stroke-success" />
          </div>

          <div>
            <p className="font-extrabold text-slate-800">
              Seus pagamentos estão protegidos
            </p>

            <p className="mt-1  text-sm font-medium leading-relaxed text-slate-500">
              Os dados completos do seu cartão não ficam armazenados no Projeto 1000.
              As informações de pagamento são processadas com segurança pela Pagar.me.
            </p>
          </div>
        </div>
      </div>

      <AlertDialog
        open={Boolean(removingCard)}
        onOpenChange={(open) => !open && setRemovingCard(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover cartão?</AlertDialogTitle>

            <AlertDialogDescription>
              O cartão deixará de aparecer entre seus métodos de pagamento. Seu
              histórico financeiro será preservado.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>
              Cancelar
            </AlertDialogCancel>

            <AlertDialogAction
              variant="destructive"
              disabled={isPending}
              onClick={handleRemove}
            >
              {isPending ? (
                <Loader2 className="mr-2 size-4 animate-spin" />
              ) : null}

              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
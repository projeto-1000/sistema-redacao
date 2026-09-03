"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, CreditCard, Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import {
  addPaymentCard,
  removePaymentCard,
  setDefaultPaymentCard,
} from "@/app/actions/payment-methods";
import { NewCardForm, type NewCardFormRef } from "@/components/extra-credits/new-card-form";
import { tokenizePagarmeCard } from "@/lib/checkout/tokenize-card";
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
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@repo/ui/components/dialog";

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
  hasActiveCardSubscription,
}: PaymentMethodsManagerProps) {
  const router = useRouter();
  const newCardFormRef = useRef<NewCardFormRef>(null);
  const [isPending, startTransition] = useTransition();
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [removingCard, setRemovingCard] = useState<ManagedPaymentCard | null>(null);
  const [pendingCardId, setPendingCardId] = useState<string | null>(null);

  async function handleAddCard() {
    const isValid = await newCardFormRef.current?.validate();

    if (!isValid) return;

    const values = newCardFormRef.current?.getValues();

    if (!values || values.paymentSource !== "new_card") return;

    setPendingCardId("new-card");

    try {
      const tokenizedCard = await tokenizePagarmeCard({
        cardNumber: values.cardNumber,
        holderName: values.holderName,
        holderDocument: values.holderDocument,
        expirationDate: values.expirationDate,
        cvv: values.cvv,
      });
      const result = await addPaymentCard({
        cardToken: tokenizedCard.id,
        billingAddress: values.address,
      });

      if (!result.success) {
        toast.error(result.message);
        return;
      }

      toast.success(result.message);
      setAddDialogOpen(false);
      startTransition(() => router.refresh());
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível adicionar o cartão.");
    } finally {
      setPendingCardId(null);
    }
  }

  function handleSetDefault(cardId: string) {
    setPendingCardId(cardId);
    startTransition(async () => {
      const result = await setDefaultPaymentCard(cardId);

      if (result.success) {
        toast.success(result.message);
        router.refresh();
      } else {
        toast.error(result.message);
      }

      setPendingCardId(null);
    });
  }

  function handleRemove() {
    if (!removingCard) return;

    const cardId = removingCard.id;
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

      setPendingCardId(null);
    });
  }

  return (
    <>
      <div className="flex justify-end">
        <Button className="h-11 rounded-xl font-semibold" onClick={() => setAddDialogOpen(true)}>
          <Plus className="mr-2 size-4" />
          Adicionar novo cartão
        </Button>
      </div>

      {cards.length === 0 ? (
        <div className="flex min-h-64 flex-col items-center justify-center rounded-3xl border-2 border-dashed border-slate-200 bg-slate-50/70 p-10 text-center">
          <div className="mb-4 rounded-2xl bg-white p-4 text-slate-400 shadow-sm">
            <CreditCard className="size-7" />
          </div>
          <h2 className="text-xl font-bold text-slate-800">Nenhum cartão salvo</h2>
          <p className="mt-2 max-w-md text-sm text-slate-500">
            Adicione um cartão para usá-lo em compras e, quando escolher, nas próximas renovações da
            assinatura.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {cards.map((card) => {
            const cardPending = isPending && pendingCardId === card.id;

            return (
              <div
                key={card.id}
                className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex min-w-0 gap-4">
                    <div className="rounded-2xl bg-slate-100 p-3 text-slate-600">
                      <CreditCard className="size-6" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-extrabold text-slate-800">
                          {formatBrand(card.brand)} •••• {card.lastFourDigits}
                        </p>
                        {card.isDefault ? <Badge>Padrão</Badge> : null}
                      </div>
                      <p className="mt-1 text-sm font-medium text-slate-500">
                        Validade {formatExpiration(card.expMonth, card.expYear)}
                      </p>
                      {card.holderName ? (
                        <p className="mt-1 truncate text-xs text-slate-400 uppercase">
                          {card.holderName}
                        </p>
                      ) : null}
                    </div>
                  </div>
                </div>

                {card.isUsedForSubscription ? (
                  <div className="mt-4 flex items-center gap-2 rounded-xl bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700">
                    <Check className="size-4" />
                    Usado na renovação da sua assinatura
                  </div>
                ) : null}

                <div className="mt-5 flex flex-wrap gap-2 border-t border-slate-100 pt-4">
                  {!card.isDefault ? (
                    <Button
                      variant="outline"
                      className="rounded-xl"
                      disabled={isPending}
                      onClick={() => handleSetDefault(card.id)}
                    >
                      {cardPending ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
                      Tornar padrão
                    </Button>
                  ) : null}
                  <Button
                    variant="ghost"
                    className="text-destructive hover:text-destructive rounded-xl"
                    disabled={isPending || card.isUsedForSubscription}
                    onClick={() => setRemovingCard(card)}
                    title={
                      card.isUsedForSubscription
                        ? "Torne outro cartão padrão antes de remover este cartão."
                        : undefined
                    }
                  >
                    <Trash2 className="mr-2 size-4" />
                    Remover
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[680px]">
          <DialogHeader>
            <DialogTitle className="text-2xl font-extrabold">Adicionar novo cartão</DialogTitle>
            <DialogDescription>
              {hasActiveCardSubscription
                ? "O novo cartão só será usado na renovação quando você o tornar padrão."
                : "O novo cartão será salvo como seu método de pagamento padrão."}
            </DialogDescription>
          </DialogHeader>

          {addDialogOpen ? <NewCardForm ref={newCardFormRef} /> : null}

          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" disabled={pendingCardId === "new-card"}>
                Cancelar
              </Button>
            </DialogClose>
            <Button onClick={handleAddCard} disabled={pendingCardId === "new-card"}>
              {pendingCardId === "new-card" ? (
                <Loader2 className="mr-2 size-4 animate-spin" />
              ) : null}
              Adicionar cartão
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={Boolean(removingCard)}
        onOpenChange={(open) => !open && setRemovingCard(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover cartão?</AlertDialogTitle>
            <AlertDialogDescription>
              O cartão deixará de aparecer entre seus métodos de pagamento. Seu histórico financeiro
              será preservado.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Cancelar</AlertDialogCancel>
            <AlertDialogAction variant="destructive" disabled={isPending} onClick={handleRemove}>
              {isPending ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

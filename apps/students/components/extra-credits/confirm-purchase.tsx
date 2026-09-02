"use client";

import { useEffect, useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@repo/ui/components/dialog";
import { Button } from "@repo/ui/components/button";
import {
  CheckCircle2,
  CreditCard,
  ArrowRight,
  Info,
  Loader2
} from "lucide-react";
import { CreditPackage } from "@repo/types";
import { getUserCredits } from "@/app/actions/credits";
import {
  PaymentMethodSelector,
  type ExtraCreditsPaymentSelection,
} from "@/components/extra-credits/payment-method-selector";
import type { SavedPaymentCard } from "@/app/actions/credits";
import { formatCurrency } from "@repo/utils";
import {
  NewCardForm,
  type NewCardFormRef,
} from "@/components/extra-credits/new-card-form";


interface ConfirmPurchaseProps {
  packageData: CreditPackage;
  savedCards: SavedPaymentCard[];
}

export function ConfirmPurchase({
  packageData,
  savedCards,
}: ConfirmPurchaseProps) {
  const newCardFormRef = useRef<NewCardFormRef>(null);
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<"confirm" | "processing" | "success">("confirm");

  const defaultCard =
    savedCards.find((card) => card.isDefault) ?? savedCards[0];

  const [paymentSelection, setPaymentSelection] =
    useState<ExtraCreditsPaymentSelection>(
      defaultCard
        ? {
          type: "saved_card",
          paymentCardId: defaultCard.id,
        }
        : {
          type: "new_card",
        }
    );

  const [currentBalance, setCurrentBalance] = useState<number>(0);

  useEffect(() => {
    if (open) {
      getUserCredits().then(setCurrentBalance);
    }
  }, [open]);

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
      setTimeout(() => setStep("confirm"), 300);
    }
  };

  const handleConfirm = async () => {
    if (!paymentSelection) {
      return;
    }

    if (paymentSelection.type === "new_card") {
      const isValid = await newCardFormRef.current?.validate();

      if (!isValid) {
        return;
      }
    }

    console.log("[EXTRA_CREDITS_PAYMENT_SELECTION]", {
      packageId: packageData.id,
      paymentSelection,
      newCard:
        paymentSelection.type === "new_card"
          ? newCardFormRef.current?.getValues()
          : undefined,
    });
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button className="w-full h-12 rounded-xl font-bold text-base">
          Comprar {packageData.credits === 1 ? "crédito" : "créditos"}
        </Button>
      </DialogTrigger>

      <DialogContent className="max-h-[90vh] overflow-y-auto border-none p-0 shadow-2xl sm:max-w-[620px]">
        {step === "confirm" && (
          <div className="p-8">
            <DialogHeader className="mb-8">
              <DialogTitle className="text-2xl font-extrabold text-slate-800">
                Confirmar Compra
              </DialogTitle>
              <p className="text-slate-500 font-medium">
                Confirme os detalhes da sua aquisição de créditos.
              </p>
            </DialogHeader>

            <div className="space-y-6">

              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400">
                  Resumo da compra
                </h4>

                <div className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
                  <p className="font-bold text-slate-700">
                    {packageData.credits}{" "}
                    {packageData.credits === 1 ? "crédito extra" : "créditos extras"}
                  </p>

                  <p className="shrink-0 text-lg font-extrabold text-slate-800">
                    {formatCurrency(packageData.price * 100)}
                  </p>
                </div>
              </div>

              <PaymentMethodSelector
                cards={savedCards}
                value={paymentSelection}
                onChange={setPaymentSelection}
              />

              {paymentSelection?.type === "new_card" ? (
                <div className="border-t border-slate-100 pt-5">
                  <NewCardForm ref={newCardFormRef} />
                </div>
              ) : null}

              <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-4 flex gap-3">
                <Info className="size-5 text-blue-500 shrink-0" />
                <p className="text-xs leading-relaxed font-semibold text-blue-700/80">
                  Ao confirmar, a cobrança será realizada no seu método de pagamento selecionado. Os créditos avulsos não possuem validade.
                </p>
              </div>

              <div className="flex gap-3">
                <Button variant="ghost" onClick={() => handleOpenChange(false)} className="flex-1 font-bold text-slate-500 h-10">
                  Cancelar
                </Button>
                <Button
                  onClick={handleConfirm}
                  disabled={!paymentSelection}
                  className="flex-1 font-bold h-10 rounded-xl"
                >
                  Confirmar Compra
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* PASSO EM PROCESSAMENTO */}
        {step === "processing" && (
          <div className="p-16 flex flex-col items-center justify-center gap-4 text-center">
            <Loader2 className="size-12 text-amber-500 animate-spin" />
            <p className="text-slate-600 font-bold">Processando seu pagamento...</p>
          </div>
        )}

        {/* PASSO 2: SUCESSO */}
        {step === "success" && (
          <div className="p-10 flex flex-col items-center text-center">
            <div className="bg-green-50 size-20 rounded-full flex items-center justify-center mb-6">
              <CheckCircle2 className="size-12 text-green-500" />
            </div>

            <h2 className="text-2xl font-extrabold text-slate-800 mb-4">
              Pedido Recebido!
            </h2>

            <p className="text-slate-500 font-medium leading-relaxed mb-8">
              Seu pagamento está sendo processado. Assim que for confirmado pelo seu banco, os
              <strong className="text-slate-700"> {packageData.credits} créditos </strong>
              serão adicionados automaticamente à sua conta.
            </p>

            <div className="w-full bg-slate-50 rounded-2xl p-4 mb-8 text-sm font-bold text-slate-400 flex items-center justify-center gap-2">
              <Info className="size-4" /> Geralmente leva menos de 1 minuto.
            </div>

            <Button onClick={() => handleOpenChange(false)} className="w-full bg-slate-800 hover:bg-slate-900 text-white font-bold h-12 rounded-xl">
              Entendido
            </Button>
          </div>
        )}

      </DialogContent>
    </Dialog>
  );
}
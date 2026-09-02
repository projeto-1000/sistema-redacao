"use client";

import { useRef, useState } from "react";
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
  Info,
  Loader2,
} from "lucide-react";
import type { CreditPackage } from "@repo/types";
import {
  purchaseExtraCredits,
  type SavedPaymentCard,
} from "@/app/actions/credits";
import {
  PaymentMethodSelector,
  type ExtraCreditsPaymentSelection,
} from "@/components/extra-credits/payment-method-selector";
import {
  NewCardForm,
  type NewCardFormRef,
} from "@/components/extra-credits/new-card-form";
import { tokenizePagarmeCard } from "@/lib/checkout/tokenize-card";
import { formatCurrency } from "@repo/utils";

interface ConfirmPurchaseProps {
  packageData: CreditPackage;
  savedCards: SavedPaymentCard[];
}

export function ConfirmPurchase({
  packageData,
  savedCards,
}: ConfirmPurchaseProps) {
  const newCardFormRef = useRef<NewCardFormRef>(null);

  const defaultCard =
    savedCards.find((card) => card.isDefault) ?? savedCards[0];

  const [open, setOpen] = useState(false);

  const [step, setStep] = useState<
    "confirm" | "processing" | "success"
  >("confirm");

  const [operationId, setOperationId] = useState<string | null>(null);

  const [purchaseMessage, setPurchaseMessage] =
    useState<string | null>(null);

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

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);

    if (isOpen) {
      if (!operationId) {
        setOperationId(crypto.randomUUID());
      }

      setPurchaseMessage(null);
      return;
    }

    window.setTimeout(() => {
      setStep("confirm");
      setPurchaseMessage(null);
      setOperationId(null);

      setPaymentSelection(
        defaultCard
          ? {
            type: "saved_card",
            paymentCardId: defaultCard.id,
          }
          : {
            type: "new_card",
          }
      );
    }, 300);
  };

  const handleConfirm = async () => {
    if (!paymentSelection || !operationId) {
      return;
    }

    setPurchaseMessage(null);

    try {
      if (paymentSelection.type === "saved_card") {
        setStep("processing");

        const result = await purchaseExtraCredits({
          packageId: packageData.id,
          operationId,
          paymentSource: "saved_card",
          paymentCardId: paymentSelection.paymentCardId,
        });

        if (!result.success) {
          setStep("confirm");
          setPurchaseMessage(
            result.message ??
            "Não foi possível processar a compra."
          );
          return;
        }

        setStep("success");
        return;
      }

      const isValid = await newCardFormRef.current?.validate();

      if (!isValid) {
        return;
      }

      const values = newCardFormRef.current?.getValues();

      if (!values || values.paymentSource !== "new_card") {
        return;
      }

      setStep("processing");

      const tokenizedCard = await tokenizePagarmeCard({
        cardNumber: values.cardNumber,
        holderName: values.holderName,
        holderDocument: values.holderDocument,
        expirationDate: values.expirationDate,
        cvv: values.cvv,
      });

      const result = await purchaseExtraCredits({
        packageId: packageData.id,
        operationId,
        paymentSource: "new_card",
        cardToken: tokenizedCard.id,
        billingAddress: values.address,
      });

      if (!result.success) {
        setStep("confirm");
        setPurchaseMessage(
          result.message ??
          "Não foi possível processar a compra."
        );
        return;
      }

      setStep("success");
    } catch (error) {
      console.error("[EXTRA_CREDIT_PURCHASE_UI_ERROR]", error);

      setStep("confirm");
      setPurchaseMessage(
        error instanceof Error
          ? error.message
          : "Não foi possível processar a compra."
      );
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={handleOpenChange}
    >
      <DialogTrigger asChild>
        <Button className="h-12 w-full rounded-xl text-base font-bold">
          Comprar{" "}
          {packageData.credits === 1
            ? "crédito"
            : "créditos"}
        </Button>
      </DialogTrigger>

      <DialogContent className="max-h-[90vh] overflow-y-auto border-none p-0 shadow-2xl sm:max-w-[620px]">
        {step === "confirm" && (
          <div className="p-8">
            <DialogHeader className="mb-8">
              <DialogTitle className="text-2xl font-extrabold text-slate-800">
                Confirmar Compra
              </DialogTitle>

              <p className="font-medium text-slate-500">
                Confirme os detalhes da sua aquisição de
                créditos.
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
                    {packageData.credits === 1
                      ? "crédito extra"
                      : "créditos extras"}
                  </p>

                  <p className="shrink-0 text-lg font-extrabold text-slate-800">
                    {formatCurrency(packageData.price * 100)}
                  </p>
                </div>
              </div>

              <PaymentMethodSelector
                cards={savedCards}
                value={paymentSelection}
                onChange={(selection) => {
                  setPaymentSelection(selection);
                  setPurchaseMessage(null);
                }}
              />

              {paymentSelection.type === "new_card" ? (
                <div className="border-t border-slate-100 pt-5">
                  <NewCardForm ref={newCardFormRef} />
                </div>
              ) : null}

              {purchaseMessage ? (
                <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-4">
                  <p className="text-sm font-semibold text-destructive">
                    {purchaseMessage}
                  </p>
                </div>
              ) : null}

              <div className="flex gap-3 rounded-xl border border-blue-100 bg-blue-50/50 p-4">
                <Info className="size-5 shrink-0 text-blue-500" />

                <p className="text-xs font-semibold leading-relaxed text-blue-700/80">
                  Ao confirmar, a cobrança será realizada no
                  método de pagamento selecionado. Os créditos
                  avulsos não possuem validade.
                </p>
              </div>

              <div className="flex gap-3">
                <Button
                  variant="ghost"
                  onClick={() => handleOpenChange(false)}
                  className="h-10 flex-1 font-bold text-slate-500"
                >
                  Cancelar
                </Button>

                <Button
                  onClick={handleConfirm}
                  className="h-10 flex-1 rounded-xl font-bold"
                >
                  Confirmar Compra
                </Button>
              </div>
            </div>
          </div>
        )}

        {step === "processing" && (
          <div className="flex flex-col items-center justify-center gap-4 p-16 text-center">
            <Loader2 className="size-12 animate-spin text-amber-500" />

            <p className="font-bold text-slate-600">
              Processando seu pagamento...
            </p>

            <p className="text-sm font-medium text-slate-400">
              Não feche esta janela.
            </p>
          </div>
        )}

        {step === "success" && (
          <div className="flex flex-col items-center p-10 text-center">
            <div className="mb-6 flex size-20 items-center justify-center rounded-full bg-green-50">
              <CheckCircle2 className="size-12 text-green-500" />
            </div>

            <h2 className="mb-4 text-2xl font-extrabold text-slate-800">
              Pedido recebido!
            </h2>

            <p className="mb-8 font-medium leading-relaxed text-slate-500">
              Seu pagamento foi recebido para processamento.
              Assim que a confirmação for concluída, os
              <strong className="text-slate-700">
                {" "}
                {packageData.credits}{" "}
                {packageData.credits === 1
                  ? "crédito"
                  : "créditos"}{" "}
              </strong>
              serão adicionados à sua conta.
            </p>

            <Button
              onClick={() => handleOpenChange(false)}
              className="h-12 w-full rounded-xl bg-slate-800 font-bold text-white hover:bg-slate-900"
            >
              Entendido
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
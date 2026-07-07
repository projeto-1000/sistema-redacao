"use client";

import { CheckoutAddressSection } from "@/components/checkout/checkout-address-section";
import { CheckoutPaymentSection } from "@/components/checkout/checkout-payment-section";
import { tokenizePagarmeCard } from "@/lib/checkout/tokenize-card";
import { zodResolver } from "@hookform/resolvers/zod";
import { Accordion } from "@repo/ui/components/accordion";
import { Button } from "@repo/ui/components/button";
import { Form } from "@repo/ui/components/form";
import { checkoutSchema, type CheckoutFormInput } from "@repo/validators";
import { onlyDigits } from "@repo/utils";
import { AlertCircle, CheckCircle2, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { useRouter } from "next/navigation";
import { createCheckoutSubscription } from "@/app/actions/checkout";

const defaultValues: CheckoutFormInput = {
  address: {
    zipCode: "",
    street: "",
    number: "",
    complement: "",
    neighborhood: "",
    city: "",
    state: "",
  },
  payment: {
    method: "credit_card",
    installments: 1,
    cardNumber: "",
    holderName: "",
    holderDocument: "",
    expirationDate: "",
    cvv: "",
    saveCard: false,
  },
};

interface CheckoutFormProps {
  planId: string;
}

export function CheckoutForm({ planId }: CheckoutFormProps) {
  const [checkoutStatus, setCheckoutStatus] = useState<
    "idle" | "tokenized" | "error"
  >("idle");
  const router = useRouter();
  const [checkoutMessage, setCheckoutMessage] = useState<string | null>(null);

  const form = useForm<CheckoutFormInput>({
    resolver: zodResolver(checkoutSchema),
    defaultValues,
    mode: "onSubmit",
    reValidateMode: "onChange",
  });

  const address = useWatch({
    control: form.control,
    name: "address",
  });

  const payment = useWatch({
    control: form.control,
    name: "payment",
  });

  const isCardPayment =
    payment.method === "credit_card" || payment.method === "debit_card";

  const hasRequiredAddressFields =
    onlyDigits(address.zipCode).length === 8 &&
    address.street.trim().length > 0 &&
    address.number.trim().length > 0 &&
    address.neighborhood.trim().length > 0 &&
    address.city.trim().length > 0 &&
    address.state.trim().length === 2;

  const hasRequiredPaymentFields =
    payment.method === "boleto" ||
    (onlyDigits(payment.cardNumber ?? "").length === 16 &&
      (payment.holderName ?? "").trim().length >= 3 &&
      onlyDigits(payment.holderDocument ?? "").length === 11 &&
      (payment.expirationDate ?? "").length === 5 &&
      onlyDigits(payment.cvv ?? "").length >= 3);

  const canContinue =
    hasRequiredAddressFields &&
    hasRequiredPaymentFields &&
    !form.formState.isSubmitting;

  function resetCheckoutStatus() {
    setCheckoutStatus("idle");
    setCheckoutMessage(null);
  }

  async function onSubmit(values: CheckoutFormInput) {
    setCheckoutStatus("idle");
    setCheckoutMessage(null);

    try {
      const isCardPayment =
        values.payment.method === "credit_card" ||
        values.payment.method === "debit_card";

      const cardToken = isCardPayment
        ? (
          await tokenizePagarmeCard({
            cardNumber: values.payment.cardNumber ?? "",
            holderName: values.payment.holderName ?? "",
            holderDocument: values.payment.holderDocument ?? "",
            expirationDate: values.payment.expirationDate ?? "",
            cvv: values.payment.cvv ?? "",
          })
        ).id
        : undefined;

      const result = await createCheckoutSubscription({
        planId,
        paymentMethod: values.payment.method,
        billingAddress: values.address,
        cardToken,
        saveCard: Boolean(values.payment.saveCard),
      });

      setCheckoutStatus("tokenized");
      setCheckoutMessage("Assinatura criada com sucesso.");

      router.refresh();

      router.push(
        `/assinatura/checkout/sucesso?subscriptionId=${result.localSubscriptionId}`
      );
    } catch (error) {
      setCheckoutStatus("error");
      setCheckoutMessage(
        error instanceof Error
          ? error.message
          : "Não foi possível finalizar a assinatura."
      );
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Accordion type="single" collapsible className="space-y-6">
          <CheckoutAddressSection onAddressChange={resetCheckoutStatus} />

          <CheckoutPaymentSection onPaymentChange={resetCheckoutStatus} />
        </Accordion>

        <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex gap-4">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary/15 text-primary">
                {checkoutStatus === "tokenized" ? (
                  <CheckCircle2 className="size-5" />
                ) : checkoutStatus === "error" ? (
                  <AlertCircle className="size-5" />
                ) : (
                  <ShieldCheck className="size-5" />
                )}
              </div>

              <div>
                <p className="text-lg font-black tracking-tight text-slate-900">
                  {checkoutStatus === "tokenized"
                    ? "Assinatura criada"
                    : checkoutStatus === "error"
                      ? "Não foi possível continuar"
                      : "Revise seus dados para finalizar"}
                </p>

                <p className="mt-1 max-w-2xl text-sm font-semibold leading-relaxed text-slate-500">
                  {checkoutMessage ??
                    "Ao finalizar, sua assinatura será criada com segurança pela Pagar.me."
                  }
                </p>
              </div>
            </div>

            <Button
              type="submit"
              disabled={!canContinue}
              className="h-12 rounded-2xl px-8 font-bold lg:min-w-44"
              isLoading={form.formState.isSubmitting}
              loadingText="Finalizando"
            >
              Finalizar assinatura
            </Button>
          </div>
        </div>
      </form>
    </Form>
  );
}
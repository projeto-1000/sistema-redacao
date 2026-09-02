"use client";

import { cn } from "@repo/ui/lib/utils";
import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@repo/ui/components/accordion"
import {
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@repo/ui/components/form";
import { RadioGroup, RadioGroupItem } from "@repo/ui/components/radio-group";
import type { CheckoutFormInput } from "@repo/validators";
import { CardFields } from "./card-fields";
import {
  Barcode,
  CreditCard,
} from "lucide-react";
import { useFormContext, useWatch } from "react-hook-form";

interface CheckoutPaymentSectionProps {
  onPaymentChange: () => void;
}

type PaymentMethod = CheckoutFormInput["payment"]["method"];

const paymentMethods = [
  {
    value: "credit_card",
    title: "Cartão de crédito",
    description: "Pagamento recorrente no cartão.",
    icon: CreditCard,
  },
  // TODO: Reativar cartão de débito quando o meio de pagamento
  // estiver habilitado na conta Pagar.me do Projeto 1000.
  //
  // {
  //   value: "debit_card",
  //   title: "Cartão de débito",
  //   description: "Pagamento usando cartão de débito.",
  //   icon: Landmark,
  // },
  {
    value: "boleto",
    title: "Boleto",
    description: "Pagamento por boleto bancário.",
    icon: Barcode,
  },
] satisfies Array<{
  value: PaymentMethod;
  title: string;
  description: string;
  icon: typeof CreditCard;
}>;

export function CheckoutPaymentSection({
  onPaymentChange,
}: CheckoutPaymentSectionProps) {
  const { control, setValue, clearErrors } =
    useFormContext<CheckoutFormInput>();

  const paymentMethod = useWatch({
    control,
    name: "payment.method",
  });

  const isCardPayment =
    paymentMethod === "credit_card" || paymentMethod === "debit_card";

  function handlePaymentMethodChange(value: PaymentMethod) {
    setValue("payment.method", value, {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: false,
    });

    setValue("payment.installments", 1, {
      shouldDirty: true,
      shouldTouch: false,
      shouldValidate: false,
    });

    clearErrors("payment");
    onPaymentChange();
  }

  return (
    <AccordionItem
      value="payment"
      className="overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm"
    >
      <AccordionTrigger className="px-6 py-6 hover:no-underline md:px-8">
        <div className="flex gap-4 text-left">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
            <CreditCard className="size-5" />
          </div>

          <div className="space-y-1">
            <h2 className="text-xl font-extrabold tracking-tight">
              Pagamento
            </h2>

            <p className="text-sm font-medium leading-relaxed text-slate-500">
              Escolha a forma de pagamento da assinatura.
            </p>
          </div>
        </div>
      </AccordionTrigger>

      <AccordionContent className="space-y-6 px-6 pb-6 md:px-8 md:pb-8">
        <FormField
          control={control}
          name="payment.method"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <RadioGroup
                  value={field.value}
                  onValueChange={(value) => handlePaymentMethodChange(value as PaymentMethod)}
                  className="grid grid-cols-1 gap-3 lg:grid-cols-2"
                >
                  {paymentMethods.map((method) => {
                    const Icon = method.icon;
                    const isSelected = field.value === method.value;

                    return (
                      <FormItem key={method.value}>
                        <FormControl>
                          <label
                            className={cn(
                              "flex cursor-pointer gap-4 rounded-2xl border bg-white p-4 transition hover:border-primary/50 hover:bg-primary/5",
                              isSelected
                                ? "border-primary bg-primary/10"
                                : "border-slate-200"
                            )}
                          >
                            <RadioGroupItem
                              value={method.value}
                              className="sr-only"
                            />

                            <div className="flex flex-1 gap-3">
                              <div
                                className={cn(
                                  "flex size-10 shrink-0 items-center justify-center rounded-xl",
                                  isSelected
                                    ? "bg-primary text-amber-950"
                                    : "bg-slate-100 text-slate-600"
                                )}
                              >
                                <Icon className="size-5" />
                              </div>

                              <div>
                                <p className="text-sm font-black ">
                                  {method.title}
                                </p>

                                <p className="mt-1 text-xs font-semibold leading-relaxed text-slate-500">
                                  {method.description}
                                </p>
                              </div>
                            </div>
                          </label>
                        </FormControl>
                      </FormItem>
                    );
                  })}
                </RadioGroup>
              </FormControl>

              <FormMessage />
            </FormItem>
          )}
        />

        {isCardPayment ? (
          <CardFields
            control={control}
            cardNumberName="payment.cardNumber"
            holderNameName="payment.holderName"
            holderDocumentName="payment.holderDocument"
            expirationDateName="payment.expirationDate"
            cvvName="payment.cvv"
            onChange={onPaymentChange}
          />
        ) : (
          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-5">
            <div className="flex gap-3">
              <Barcode className="mt-0.5 size-5 shrink-0 text-primary" />

              <div>
                <p className="text-sm font-black">
                  Pagamento por boleto
                </p>

                <p className="mt-1 text-sm font-semibold leading-relaxed text-slate-600">
                  O boleto será gerado após a confirmação da assinatura. A ativação pode depender da compensação do pagamento.
                </p>
              </div>
            </div>
          </div>
        )}
      </AccordionContent>
    </AccordionItem>
  );
}

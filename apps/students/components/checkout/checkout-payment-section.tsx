"use client";

import {
  formatCardCvv,
  formatCardExpiration,
  formatCardNumber,
  normalizeCardHolderName,
} from "@/lib/checkout/card-formatters";
import { cn } from "@repo/ui/lib/utils";
import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@repo/ui/components/accordion"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/select"
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@repo/ui/components/form";
import { Input } from "@repo/ui/components/input";
import { RadioGroup, RadioGroupItem } from "@repo/ui/components/radio-group";
import type { CheckoutFormInput } from "@repo/validators";
import { formatCPF } from "@repo/utils";
import {
  Barcode,
  CreditCard,
  Landmark,
  ShieldCheck,
} from "lucide-react";
import { useFormContext, useWatch } from "react-hook-form";
import { Checkbox } from "@repo/ui/components/checkbox";

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
  {
    value: "debit_card",
    title: "Cartão de débito",
    description: "Pagamento usando cartão de débito.",
    icon: Landmark,
  },
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
                  className="grid grid-cols-1 gap-3 lg:grid-cols-3"
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
          <div className="space-y-6">
            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
              <div className="flex gap-3 items-center">
                <ShieldCheck className="size-4.5 shrink-0 text-success" />

                <p className="text-sm font-semibold leading-relaxed text-slate-600">
                  Os dados do cartão serão validados com segurança antes da assinatura ser criada.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
              <FormField
                control={control}
                name="payment.cardNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Número do cartão</FormLabel>

                    <FormControl>
                      <Input
                        {...field}
                        value={field.value ?? ""}
                        inputMode="numeric"
                        autoComplete="cc-number"
                        maxLength={19}
                        placeholder="0000 0000 0000 0000"
                        className="h-12 rounded-xl border-slate-200 bg-slate-50 font-semibold text-slate-700"
                        onChange={(event) => {
                          field.onChange(formatCardNumber(event.target.value));
                          onPaymentChange();
                        }}
                      />
                    </FormControl>

                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={control}
                name="payment.holderName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome impresso no cartão</FormLabel>

                    <FormControl>
                      <Input
                        {...field}
                        value={field.value ?? ""}
                        autoComplete="cc-name"
                        placeholder="Nome completo"
                        className="h-12 rounded-xl border-slate-200 bg-slate-50 font-semibold uppercase text-slate-700"
                        onChange={(event) => {
                          field.onChange(
                            normalizeCardHolderName(event.target.value)
                          );
                          onPaymentChange();
                        }}
                      />
                    </FormControl>

                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>


            <div
              className={cn(
                "grid grid-cols-1 gap-5",
                paymentMethod === "credit_card" ? "md:grid-cols-4" : "md:grid-cols-3"
              )}
            >
              <FormField
                control={control}
                name="payment.holderDocument"
                render={({ field }) => (
                  <FormItem className="md:col-span-1">
                    <FormLabel>CPF do titular</FormLabel>

                    <FormControl>
                      <Input
                        {...field}
                        value={field.value ?? ""}
                        inputMode="numeric"
                        autoComplete="off"
                        placeholder="000.000.000-00"
                        className="h-12 rounded-xl border-slate-200 bg-slate-50 font-semibold text-slate-700"
                        onChange={(event) => {
                          field.onChange(formatCPF(event.target.value));
                          onPaymentChange();
                        }}
                      />
                    </FormControl>

                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={control}
                name="payment.expirationDate"
                render={({ field }) => (
                  <FormItem className="md:col-span-1">

                    <FormLabel>Validade</FormLabel>

                    <FormControl>
                      <Input
                        {...field}
                        value={field.value ?? ""}
                        inputMode="numeric"
                        autoComplete="cc-exp"
                        maxLength={5}
                        placeholder="MM/AA"
                        className="h-12 rounded-xl border-slate-200 bg-slate-50 font-semibold text-slate-700"
                        onChange={(event) => {
                          field.onChange(
                            formatCardExpiration(event.target.value)
                          );
                          onPaymentChange();
                        }}
                      />
                    </FormControl>

                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={control}
                name="payment.cvv"
                render={({ field }) => (
                  <FormItem className="md:col-span-1">

                    <FormLabel>CVV</FormLabel>

                    <FormControl>
                      <Input
                        {...field}
                        value={field.value ?? ""}
                        type="password"
                        inputMode="numeric"
                        autoComplete="cc-csc"
                        maxLength={4}
                        placeholder="123"
                        className="h-12 rounded-xl border-slate-200 bg-slate-50 font-semibold text-slate-700"
                        onChange={(event) => {
                          field.onChange(formatCardCvv(event.target.value));
                          onPaymentChange();
                        }}
                      />
                    </FormControl>

                    <FormMessage />
                  </FormItem>
                )}
              />

              {paymentMethod === "credit_card" && (
                <FormField
                  control={control}
                  name="payment.installments"
                  render={({ field }) => (
                    <FormItem className="md:col-span-1">
                      <FormLabel>Parcelamento</FormLabel>

                      <Select
                        value={String(field.value ?? 1)}
                        onValueChange={(value) => {
                          field.onChange(Number(value))
                          onPaymentChange()
                        }}
                      >
                        <FormControl>
                          <SelectTrigger className="h-12 w-full rounded-xl border-slate-200 bg-slate-50 font-semibold text-slate-700">
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                        </FormControl>

                        <SelectContent>
                          <SelectItem value="1">1x</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

            </div>

            <FormField
              control={control}
              name="payment.saveCard"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start gap-3 rounded-2xl border border-slate-100 bg-slate-50/80 p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      className="mt-0.5 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                    />
                  </FormControl>

                  <div className="space-y-1 leading-none">
                    <FormLabel className="text-sm font-bold text-slate-700">
                      Salvar cartão para próximas assinaturas
                    </FormLabel>

                    <p className="text-xs font-medium leading-relaxed text-slate-500">
                      Seu cartão será salvo de forma segura pela Pagar.me. O sistema armazenará apenas a bandeira, os últimos dígitos e a validade.
                    </p>

                    <FormMessage />
                  </div>
                </FormItem>
              )}
            />
          </div>
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
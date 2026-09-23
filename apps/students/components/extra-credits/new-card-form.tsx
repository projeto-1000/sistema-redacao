"use client";

import { CardFields } from "@/components/checkout/card-fields";
import { getAddressByCep } from "@/lib/cep";
import { formatZipCode } from "@/utils/format-zipcode";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@repo/ui/components/accordion";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@repo/ui/components/form";
import { Input } from "@repo/ui/components/input";
import { extraCreditsPaymentSchema, type ExtraCreditsPaymentInput } from "@repo/validators";
import { CircleAlert, Loader2, MapPin, ShieldCheck } from "lucide-react";
import {
  type ReactNode,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  forwardRef,
} from "react";
import { useForm, useWatch } from "react-hook-form";

export interface NewCardFormRef {
  validate: () => Promise<boolean>;
  getValues: () => ExtraCreditsPaymentInput;
  clearCvv: () => void;
}

interface NewCardFormProps {
  cardError?: string | null;
  compact?: boolean;
}

function BillingAddressSection({
  children,
  compact,
  isOpen,
  onOpenChange,
  summary,
}: {
  children: ReactNode;
  compact: boolean;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  summary: string;
}) {
  if (!compact) {
    return (
      <div className="border-t border-slate-100 pt-5">
        <div className="mb-4 flex items-center gap-2">
          <MapPin className="size-4 text-slate-500" />

          <div>
            <p className="text-sm font-extrabold text-slate-700">Endereço de cobrança</p>
            <p className="text-xs font-medium text-slate-500">
              Digite o CEP para preencher o endereço.
            </p>
          </div>
        </div>

        {children}
      </div>
    );
  }

  return (
    <Accordion
      type="single"
      collapsible
      value={isOpen ? "billing-address" : ""}
      onValueChange={(value) => onOpenChange(value === "billing-address")}
      className="w-full"
    >
      <AccordionItem
        value="billing-address"
        className="overflow-hidden rounded-xl border border-slate-200 bg-white last:border-b!"
      >
        <AccordionTrigger className="px-4 py-3 hover:no-underline [&>svg]:size-4 [&>svg]:shrink-0">
          <div className="flex min-w-0 items-center gap-3 text-left">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
              <MapPin className="size-4" />
            </div>

            <div className="min-w-0">
              <p className="font-extrabold text-slate-700">Endereço de cobrança</p>
              <p className="truncate text-xs font-medium text-slate-500">{summary}</p>
            </div>
          </div>
        </AccordionTrigger>

        <AccordionContent className="border-t border-slate-100 px-4 py-4">
          {children}
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}

export const NewCardForm = forwardRef<NewCardFormRef, NewCardFormProps>(function NewCardForm(
  { cardError = null, compact = false },
  ref
) {
  const [isFetchingCep, setIsFetchingCep] = useState(false);
  const [isCepResolved, setIsCepResolved] = useState(false);
  const [cepLookupError, setCepLookupError] = useState<string | null>(null);
  const [isAddressOpen, setIsAddressOpen] = useState(!compact);
  const cardErrorRef = useRef<HTMLDivElement>(null);

  const form = useForm<ExtraCreditsPaymentInput>({
    resolver: zodResolver(extraCreditsPaymentSchema),
    mode: "onChange",
    defaultValues: {
      paymentSource: "new_card",
      paymentCardId: null,

      cardNumber: "",
      holderName: "",
      holderDocument: "",
      expirationDate: "",
      cvv: "",

      address: {
        zipCode: "",
        street: "",
        number: "",
        complement: "",
        neighborhood: "",
        city: "",
        state: "",
      },
    },
  });

  useImperativeHandle(ref, () => ({
    validate: async () => {
      const isValid = await form.trigger();
      const addressFieldNames = [
        "address.zipCode",
        "address.street",
        "address.number",
        "address.neighborhood",
        "address.city",
        "address.state",
      ] as const;
      const hasAddressError = addressFieldNames.some(
        (fieldName) => form.getFieldState(fieldName).invalid
      );

      if (hasAddressError) {
        setIsAddressOpen(true);
      }

      return isValid;
    },
    getValues: () => form.getValues(),
    clearCvv: () => {
      form.setValue("cvv", "", { shouldDirty: true, shouldValidate: false });
      form.clearErrors("cvv");
    },
  }));

  const zipCode = useWatch({
    control: form.control,
    name: "address.zipCode",
  });
  const address = useWatch({
    control: form.control,
    name: "address",
  });

  const sanitizedZipCode = (zipCode ?? "").replace(/\D/g, "");

  const clearResolvedAddress = useCallback(() => {
    form.setValue("address.street", "");
    form.setValue("address.number", "");
    form.setValue("address.complement", "");
    form.setValue("address.neighborhood", "");
    form.setValue("address.city", "");
    form.setValue("address.state", "");
  }, [form]);

  useEffect(() => {
    if (!cardError) {
      return;
    }

    const animationFrame = window.requestAnimationFrame(() => {
      cardErrorRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
    });

    return () => window.cancelAnimationFrame(animationFrame);
  }, [cardError]);

  useEffect(() => {
    if (sanitizedZipCode.length !== 8) {
      clearResolvedAddress();
      setIsCepResolved(false);
      setCepLookupError(null);
      return;
    }

    const abortController = new AbortController();

    async function fetchCep() {
      try {
        setIsFetchingCep(true);
        setIsCepResolved(false);
        setCepLookupError(null);

        const address = await getAddressByCep(sanitizedZipCode, abortController.signal);

        form.setValue("address.zipCode", formatZipCode(address.zipCode), {
          shouldValidate: true,
        });

        form.setValue("address.street", address.street, {
          shouldValidate: true,
        });

        form.setValue("address.neighborhood", address.neighborhood, {
          shouldValidate: true,
        });

        form.setValue("address.city", address.city, {
          shouldValidate: true,
        });

        form.setValue("address.state", address.state, {
          shouldValidate: true,
        });

        setIsCepResolved(true);
      } catch (error) {
        if (abortController.signal.aborted) {
          return;
        }

        clearResolvedAddress();
        setIsCepResolved(false);

        setCepLookupError(
          error instanceof Error ? error.message : "Não foi possível buscar o CEP."
        );
      } finally {
        if (!abortController.signal.aborted) {
          setIsFetchingCep(false);
        }
      }
    }

    const timeoutId = window.setTimeout(fetchCep, 500);

    return () => {
      window.clearTimeout(timeoutId);
      abortController.abort();
    };
  }, [clearResolvedAddress, form, sanitizedZipCode]);

  const addressFieldsDisabled = !isCepResolved || isFetchingCep;
  const addressSummary = isCepResolved
    ? [address?.street, address?.number, address?.city].filter(Boolean).join(", ")
    : "Digite o CEP para preencher o endereço";

  return (
    <Form {...form}>
      <div className="space-y-6">
        <div className="flex gap-3 rounded-xl border border-slate-100 bg-slate-50 p-3">
          <ShieldCheck className="text-success mt-0.5 size-4 shrink-0" />

          <p className="text-xs leading-relaxed font-semibold text-slate-600">
            Os dados do cartão são enviados com segurança para processamento do pagamento.
          </p>
        </div>

        <CardFields
          control={form.control}
          cardNumberName="cardNumber"
          holderNameName="holderName"
          holderDocumentName="holderDocument"
          expirationDateName="expirationDate"
          cvvName="cvv"
        />

        {cardError ? (
          <div
            ref={cardErrorRef}
            role="alert"
            aria-live="assertive"
            className="border-destructive/25 bg-destructive/5 flex gap-3 rounded-xl border p-4"
          >
            <CircleAlert className="text-destructive mt-0.5 size-5 shrink-0" />
            <p className="text-destructive text-sm leading-relaxed font-semibold">{cardError}</p>
          </div>
        ) : null}

        <BillingAddressSection
          compact={compact}
          isOpen={isAddressOpen}
          onOpenChange={setIsAddressOpen}
          summary={addressSummary}
        >
          <div className="grid grid-cols-1 gap-4 md:grid-cols-12">
            <FormField
              control={form.control}
              name="address.zipCode"
              render={({ field }) => (
                <FormItem className="md:col-span-4">
                  <FormLabel>CEP</FormLabel>

                  <FormControl>
                    <div className="relative">
                      <Input
                        {...field}
                        inputMode="numeric"
                        autoComplete="postal-code"
                        maxLength={9}
                        placeholder="00000-000"
                        className="h-11 rounded-xl border-slate-200 bg-slate-50 pr-9 font-semibold"
                        onChange={(event) => field.onChange(formatZipCode(event.target.value))}
                      />

                      {isFetchingCep ? (
                        <Loader2 className="absolute top-1/2 right-3 size-4 -translate-y-1/2 animate-spin text-slate-400" />
                      ) : null}
                    </div>
                  </FormControl>

                  {cepLookupError ? (
                    <p className="text-destructive text-xs font-medium">{cepLookupError}</p>
                  ) : isCepResolved ? (
                    <FormDescription className="text-xs font-semibold text-emerald-600">
                      CEP encontrado.
                    </FormDescription>
                  ) : null}

                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="hidden md:col-span-8 md:block" />

            <FormField
              control={form.control}
              name="address.street"
              render={({ field }) => (
                <FormItem className="md:col-span-8">
                  <FormLabel>Rua</FormLabel>

                  <FormControl>
                    <Input
                      {...field}
                      disabled={addressFieldsDisabled}
                      autoComplete="address-line1"
                      className="h-11 rounded-xl border-slate-200 bg-slate-50 font-semibold"
                    />
                  </FormControl>

                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="address.number"
              render={({ field }) => (
                <FormItem className="md:col-span-4">
                  <FormLabel>Número</FormLabel>

                  <FormControl>
                    <Input
                      {...field}
                      disabled={addressFieldsDisabled}
                      placeholder="123"
                      className="h-11 rounded-xl border-slate-200 bg-slate-50 font-semibold"
                    />
                  </FormControl>

                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="address.complement"
              render={({ field }) => (
                <FormItem className="md:col-span-12">
                  <FormLabel>Complemento</FormLabel>

                  <FormControl>
                    <Input
                      {...field}
                      value={field.value ?? ""}
                      disabled={addressFieldsDisabled}
                      autoComplete="address-line2"
                      placeholder="Apartamento, bloco, casa..."
                      className="h-11 rounded-xl border-slate-200 bg-slate-50 font-semibold"
                    />
                  </FormControl>

                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="address.neighborhood"
              render={({ field }) => (
                <FormItem className="md:col-span-5">
                  <FormLabel>Bairro</FormLabel>

                  <FormControl>
                    <Input
                      {...field}
                      disabled={addressFieldsDisabled}
                      className="h-11 rounded-xl border-slate-200 bg-slate-50 font-semibold"
                    />
                  </FormControl>

                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="address.city"
              render={({ field }) => (
                <FormItem className="md:col-span-5">
                  <FormLabel>Cidade</FormLabel>

                  <FormControl>
                    <Input
                      {...field}
                      disabled={addressFieldsDisabled}
                      autoComplete="address-level2"
                      className="h-11 rounded-xl border-slate-200 bg-slate-50 font-semibold"
                    />
                  </FormControl>

                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="address.state"
              render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel>UF</FormLabel>

                  <FormControl>
                    <Input
                      {...field}
                      disabled={addressFieldsDisabled}
                      autoComplete="address-level1"
                      maxLength={2}
                      className="h-11 rounded-xl border-slate-200 bg-slate-50 text-center font-semibold uppercase"
                      onChange={(event) => field.onChange(event.target.value.toUpperCase())}
                    />
                  </FormControl>

                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </BillingAddressSection>
      </div>
    </Form>
  );
});

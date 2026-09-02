"use client";

import { CardFields } from "@/components/checkout/card-fields";
import { getAddressByCep } from "@/lib/cep";
import { formatZipCode } from "@/utils/format-zipcode";
import { zodResolver } from "@hookform/resolvers/zod";
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
import {
  extraCreditsPaymentSchema,
  type ExtraCreditsPaymentInput,
} from "@repo/validators";
import { Loader2, MapPin, ShieldCheck } from "lucide-react";
import {
  useCallback,
  useEffect,
  useImperativeHandle,
  useState,
  forwardRef,
} from "react";
import { useForm, useWatch } from "react-hook-form";

export interface NewCardFormRef {
  validate: () => Promise<boolean>;
  getValues: () => ExtraCreditsPaymentInput;
}

export const NewCardForm = forwardRef<NewCardFormRef>(
  function NewCardForm(_, ref) {
    const [isFetchingCep, setIsFetchingCep] = useState(false);
    const [isCepResolved, setIsCepResolved] = useState(false);
    const [cepLookupError, setCepLookupError] = useState<string | null>(null);

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
      validate: () => form.trigger(),
      getValues: () => form.getValues(),
    }));

    const zipCode = useWatch({
      control: form.control,
      name: "address.zipCode",
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

          const address = await getAddressByCep(
            sanitizedZipCode,
            abortController.signal
          );

          form.setValue(
            "address.zipCode",
            formatZipCode(address.zipCode),
            {
              shouldValidate: true,
            }
          );

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
            error instanceof Error
              ? error.message
              : "Não foi possível buscar o CEP."
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

    const addressFieldsDisabled =
      !isCepResolved || isFetchingCep;

    return (
      <Form {...form}>
        <div className="space-y-6">
          <div className="flex gap-3 rounded-xl border border-slate-100 bg-slate-50 p-3">
            <ShieldCheck className="mt-0.5 size-4 shrink-0 text-success" />

            <p className="text-xs font-semibold leading-relaxed text-slate-600">
              Os dados do cartão são enviados com segurança para processamento
              do pagamento.
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

          <div className="border-t border-slate-100 pt-5">
            <div className="mb-4 flex items-center gap-2">
              <MapPin className="size-4 text-slate-500" />

              <div>
                <p className="text-sm font-extrabold text-slate-700">
                  Endereço de cobrança
                </p>

                <p className="text-xs font-medium text-slate-500">
                  Digite o CEP para preencher o endereço.
                </p>
              </div>
            </div>

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
                          onChange={(event) =>
                            field.onChange(
                              formatZipCode(event.target.value)
                            )
                          }
                        />

                        {isFetchingCep ? (
                          <Loader2 className="absolute right-3 top-1/2 size-4 -translate-y-1/2 animate-spin text-slate-400" />
                        ) : null}
                      </div>
                    </FormControl>

                    {cepLookupError ? (
                      <p className="text-xs font-medium text-destructive">
                        {cepLookupError}
                      </p>
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
                        onChange={(event) =>
                          field.onChange(
                            event.target.value.toUpperCase()
                          )
                        }
                      />
                    </FormControl>

                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
        </div>
      </Form>
    );
  }
);
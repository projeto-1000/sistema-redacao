"use client";

import { getAddressByCep } from "@/lib/cep";
import { formatZipCode } from "@/utils/format-zipcode";
import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@repo/ui/components/accordion"
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@repo/ui/components/form";
import { Input } from "@repo/ui/components/input";
import type { CheckoutFormInput } from "@repo/validators";
import { Loader2, MapPin } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useFormContext, useWatch } from "react-hook-form";

interface CheckoutAddressSectionProps {
  onAddressChange: () => void;
}

export function CheckoutAddressSection({
  onAddressChange,
}: CheckoutAddressSectionProps) {
  const [isFetchingCep, setIsFetchingCep] = useState(false);
  const [isCepResolved, setIsCepResolved] = useState(false);
  const [cepLookupError, setCepLookupError] = useState<string | null>(null);

  const { control, setValue } = useFormContext<CheckoutFormInput>();

  const zipCode = useWatch({
    control,
    name: "address.zipCode",
  });

  const sanitizedZipCode = zipCode.replace(/\D/g, "");

  const clearAddressFields = useCallback(() => {
    setValue("address.street", "", {
      shouldDirty: true,
      shouldTouch: false,
      shouldValidate: false,
    });

    setValue("address.number", "", {
      shouldDirty: true,
      shouldTouch: false,
      shouldValidate: false,
    });

    setValue("address.complement", "", {
      shouldDirty: true,
      shouldTouch: false,
      shouldValidate: false,
    });

    setValue("address.neighborhood", "", {
      shouldDirty: true,
      shouldTouch: false,
      shouldValidate: false,
    });

    setValue("address.city", "", {
      shouldDirty: true,
      shouldTouch: false,
      shouldValidate: false,
    });

    setValue("address.state", "", {
      shouldDirty: true,
      shouldTouch: false,
      shouldValidate: false,
    });
  }, [setValue]);

  useEffect(() => {
    if (sanitizedZipCode.length !== 8) {
      clearAddressFields();
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

        setValue("address.zipCode", formatZipCode(address.zipCode), {
          shouldDirty: true,
          shouldTouch: false,
          shouldValidate: false,
        });

        setValue("address.street", address.street, {
          shouldDirty: true,
          shouldTouch: false,
          shouldValidate: false,
        });

        setValue("address.neighborhood", address.neighborhood, {
          shouldDirty: true,
          shouldTouch: false,
          shouldValidate: false,
        });

        setValue("address.city", address.city, {
          shouldDirty: true,
          shouldTouch: false,
          shouldValidate: false,
        });

        setValue("address.state", address.state, {
          shouldDirty: true,
          shouldTouch: false,
          shouldValidate: false,
        });

        setIsCepResolved(true);
      } catch (error) {
        if (abortController.signal.aborted) {
          return;
        }

        clearAddressFields();
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
  }, [clearAddressFields, sanitizedZipCode, setValue]);

  const shouldDisableAddressFields = !isCepResolved || isFetchingCep;

  return (
    <AccordionItem
      value="address"
      className="overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm"
    >
      <AccordionTrigger className="px-6 py-6 hover:no-underline md:px-8">
        <div className="flex gap-4 text-left">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
            <MapPin className="size-5" />
          </div>

          <div className="space-y-1">
            <h2 className="text-xl font-extrabold tracking-tight">
              Endereço de cobrança
            </h2>

            <p className="text-sm font-medium leading-relaxed text-slate-500">
              Digite o CEP para preencher automaticamente o endereço.
            </p>
          </div>
        </div>
      </AccordionTrigger>

      <AccordionContent className="px-6 pb-6 md:px-8 md:pb-8">
        <div className="grid grid-cols-1 gap-5 md:grid-cols-12">
          <FormField
            control={control}
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
                      className="h-12 rounded-xl border-slate-200 bg-slate-50 pr-10 font-semibold text-slate-700"
                      onChange={(event) => {
                        field.onChange(formatZipCode(event.target.value));
                        onAddressChange();
                      }}
                    />

                    {isFetchingCep && (
                      <Loader2 className="absolute right-3 top-1/2 size-4 -translate-y-1/2 animate-spin text-slate-400" />
                    )}
                  </div>
                </FormControl>

                {cepLookupError ? (
                  <p className="text-sm font-medium text-destructive">
                    {cepLookupError}
                  </p>
                ) : isCepResolved ? (
                  <FormDescription className="font-semibold text-emerald-600">
                    CEP encontrado. Complete o número.
                  </FormDescription>
                )
                  : (
                    <FormDescription>
                      Os demais campos serão liberados após a busca do CEP.
                    </FormDescription>
                  )
                }

                <FormMessage />
              </FormItem>
            )}
          />

          <div className="hidden md:col-span-8 md:block" />

          <FormField
            control={control}
            name="address.street"
            render={({ field }) => (
              <FormItem className="md:col-span-8">
                <FormLabel>Rua</FormLabel>

                <FormControl>
                  <Input
                    {...field}
                    disabled={shouldDisableAddressFields}
                    autoComplete="address-line1"
                    placeholder="Preenchida automaticamente pelo CEP"
                    className="h-12 rounded-xl border-slate-200 bg-slate-50 font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
                    onChange={(event) => {
                      field.onChange(event);
                      onAddressChange();
                    }}
                  />
                </FormControl>

                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="address.number"
            render={({ field }) => (
              <FormItem className="md:col-span-4">
                <FormLabel>Número</FormLabel>

                <FormControl>
                  <Input
                    {...field}
                    disabled={shouldDisableAddressFields}
                    placeholder="123"
                    className="h-12 rounded-xl border-slate-200 bg-slate-50 font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
                    onChange={(event) => {
                      field.onChange(event);
                      onAddressChange();
                    }}
                  />
                </FormControl>

                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="address.complement"
            render={({ field }) => (
              <FormItem className="md:col-span-12">
                <FormLabel>Complemento</FormLabel>

                <FormControl>
                  <Input
                    {...field}
                    disabled={shouldDisableAddressFields}
                    autoComplete="address-line2"
                    placeholder="Apartamento, bloco, casa..."
                    className="h-12 rounded-xl border-slate-200 bg-slate-50 font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
                    onChange={(event) => {
                      field.onChange(event);
                      onAddressChange();
                    }}
                  />
                </FormControl>

                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="address.neighborhood"
            render={({ field }) => (
              <FormItem className="md:col-span-5">
                <FormLabel>Bairro</FormLabel>

                <FormControl>
                  <Input
                    {...field}
                    disabled={shouldDisableAddressFields}
                    placeholder="Preenchido automaticamente"
                    className="h-12 rounded-xl border-slate-200 bg-slate-50 font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
                    onChange={(event) => {
                      field.onChange(event);
                      onAddressChange();
                    }}
                  />
                </FormControl>

                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="address.city"
            render={({ field }) => (
              <FormItem className="md:col-span-5">
                <FormLabel>Cidade</FormLabel>

                <FormControl>
                  <Input
                    {...field}
                    disabled={shouldDisableAddressFields}
                    autoComplete="address-level2"
                    placeholder="Preenchida automaticamente"
                    className="h-12 rounded-xl border-slate-200 bg-slate-50 font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
                    onChange={(event) => {
                      field.onChange(event);
                      onAddressChange();
                    }}
                  />
                </FormControl>

                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="address.state"
            render={({ field }) => (
              <FormItem className="md:col-span-2">
                <FormLabel>UF</FormLabel>

                <FormControl>
                  <Input
                    {...field}
                    disabled={shouldDisableAddressFields}
                    autoComplete="address-level1"
                    maxLength={2}
                    placeholder="UF"
                    className="h-12 rounded-xl border-slate-200 bg-slate-50 text-center font-semibold uppercase text-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
                    onChange={(event) => {
                      field.onChange(event.target.value.toUpperCase());
                      onAddressChange();
                    }}
                  />
                </FormControl>

                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}

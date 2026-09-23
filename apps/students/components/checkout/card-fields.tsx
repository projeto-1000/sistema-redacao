"use client";

import {
  formatCardCvv,
  formatCardExpiration,
  formatCardNumber,
  normalizeCardHolderName,
} from "@/lib/checkout/card-formatters";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@repo/ui/components/form";
import { Input } from "@repo/ui/components/input";
import { formatCPF } from "@repo/utils";
import type { Control, FieldValues, Path } from "react-hook-form";

interface CardFieldsProps<TFieldValues extends FieldValues> {
  control: Control<TFieldValues>;
  cardNumberName: Path<TFieldValues>;
  holderNameName: Path<TFieldValues>;
  holderDocumentName: Path<TFieldValues>;
  expirationDateName: Path<TFieldValues>;
  cvvName: Path<TFieldValues>;
  onChange?: () => void;
}

const formItemClassName =
  "grid grid-rows-[20px_48px_20px] gap-2 space-y-0";

const formMessageWrapperClassName = "h-5 overflow-hidden";

const formMessageClassName = "text-xs leading-4";

export function CardFields<TFieldValues extends FieldValues>({
  control,
  cardNumberName,
  holderNameName,
  holderDocumentName,
  expirationDateName,
  cvvName,
  onChange,
}: CardFieldsProps<TFieldValues>) {
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <FormField
          control={control}
          name={cardNumberName}
          render={({ field }) => (
            <FormItem className={formItemClassName}>
              <FormLabel>Número do cartão</FormLabel>

              <FormControl>
                <Input
                  {...field}
                  value={(field.value as string | undefined) ?? ""}
                  inputMode="numeric"
                  autoComplete="cc-number"
                  maxLength={19}
                  placeholder="0000 0000 0000 0000"
                  className="h-12 rounded-xl border-slate-200 bg-slate-50 font-semibold text-slate-700"
                  onChange={(event) => {
                    field.onChange(formatCardNumber(event.target.value));
                    onChange?.();
                  }}
                />
              </FormControl>

              <div className={formMessageWrapperClassName}>
                <FormMessage className={formMessageClassName} />
              </div>
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name={holderNameName}
          render={({ field }) => (
            <FormItem className={formItemClassName}>
              <FormLabel>Nome impresso no cartão</FormLabel>

              <FormControl>
                <Input
                  {...field}
                  value={(field.value as string | undefined) ?? ""}
                  autoComplete="cc-name"
                  placeholder="Nome completo"
                  className="h-12 rounded-xl border-slate-200 bg-slate-50 font-semibold uppercase text-slate-700"
                  onChange={(event) => {
                    field.onChange(
                      normalizeCardHolderName(event.target.value)
                    );
                    onChange?.();
                  }}
                />
              </FormControl>

              <div className={formMessageWrapperClassName}>
                <FormMessage className={formMessageClassName} />
              </div>
            </FormItem>
          )}
        />
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
        <FormField
          control={control}
          name={holderDocumentName}
          render={({ field }) => (
            <FormItem className={formItemClassName}>
              <FormLabel>CPF do titular</FormLabel>

              <FormControl>
                <Input
                  {...field}
                  value={(field.value as string | undefined) ?? ""}
                  inputMode="numeric"
                  autoComplete="off"
                  placeholder="000.000.000-00"
                  className="h-12 rounded-xl border-slate-200 bg-slate-50 font-semibold text-slate-700"
                  onChange={(event) => {
                    field.onChange(formatCPF(event.target.value));
                    onChange?.();
                  }}
                />
              </FormControl>

              <div className={formMessageWrapperClassName}>
                <FormMessage className={formMessageClassName} />
              </div>
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name={expirationDateName}
          render={({ field }) => (
            <FormItem className={formItemClassName}>
              <FormLabel>Validade</FormLabel>

              <FormControl>
                <Input
                  {...field}
                  value={(field.value as string | undefined) ?? ""}
                  inputMode="numeric"
                  autoComplete="cc-exp"
                  maxLength={5}
                  placeholder="MM/AA"
                  className="h-12 rounded-xl border-slate-200 bg-slate-50 font-semibold text-slate-700"
                  onChange={(event) => {
                    field.onChange(
                      formatCardExpiration(event.target.value)
                    );
                    onChange?.();
                  }}
                />
              </FormControl>

              <div className={formMessageWrapperClassName}>
                <FormMessage className={formMessageClassName} />
              </div>
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name={cvvName}
          render={({ field }) => (
            <FormItem className={formItemClassName}>
              <FormLabel>CVV</FormLabel>

              <FormControl>
                <Input
                  {...field}
                  value={(field.value as string | undefined) ?? ""}
                  type="password"
                  inputMode="numeric"
                  autoComplete="cc-csc"
                  maxLength={3}
                  placeholder="123"
                  className="h-12 rounded-xl border-slate-200 bg-slate-50 font-semibold text-slate-700"
                  onChange={(event) => {
                    field.onChange(formatCardCvv(event.target.value));
                    onChange?.();
                  }}
                />
              </FormControl>

              <div className={formMessageWrapperClassName}>
                <FormMessage className={formMessageClassName} />
              </div>
            </FormItem>
          )}
        />
      </div>
    </div>
  );
}
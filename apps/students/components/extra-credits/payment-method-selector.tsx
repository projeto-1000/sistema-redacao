"use client";
import type { SavedPaymentCard } from "@/app/actions/credits";
import { cn } from "@repo/ui/lib/utils";
import { RadioGroup, RadioGroupItem } from "@repo/ui/components/radio-group";
import { CreditCard, Plus } from "lucide-react";

export type ExtraCreditsPaymentSelection =
  | {
    type: "saved_card";
    paymentCardId: string;
  }
  | {
    type: "new_card";
  };

interface PaymentMethodSelectorProps {
  cards: SavedPaymentCard[];
  value: ExtraCreditsPaymentSelection | null;
  onChange: (value: ExtraCreditsPaymentSelection) => void;
}

function getCardBrandLabel(brand: string | null) {
  if (!brand) {
    return "Cartão de crédito";
  }

  const normalizedBrand = brand.toLowerCase();

  const labels: Record<string, string> = {
    visa: "Visa",
    mastercard: "Mastercard",
    elo: "Elo",
    amex: "American Express",
    hipercard: "Hipercard",
  };

  return labels[normalizedBrand] ?? brand;
}

export function PaymentMethodSelector({
  cards,
  value,
  onChange,
}: PaymentMethodSelectorProps) {

  return (
    <div className="space-y-4">
      <div>
        <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400">
          Forma de pagamento
        </h4>
      </div>

      <RadioGroup
        value={
          value?.type === "saved_card"
            ? value.paymentCardId
            : value?.type === "new_card"
              ? "new_card"
              : undefined
        }
        onValueChange={(selectedValue) => {
          if (selectedValue === "new_card") {
            onChange({
              type: "new_card",
            });

            return;
          }

          onChange({
            type: "saved_card",
            paymentCardId: selectedValue,
          });
        }}
        className="grid grid-cols-1 gap-3"
      >
        {cards.map((card) => {
          const isSelected =
            value?.type === "saved_card" &&
            value.paymentCardId === card.id;

          return (
            <label
              key={card.id}
              className={cn(
                "flex cursor-pointer items-center gap-4 rounded-2xl border bg-white px-4 py-2.5 transition",
                "hover:border-primary/50 hover:bg-primary/5",
                isSelected
                  ? "border-primary bg-primary/10"
                  : "border-slate-200"
              )}
            >
              <RadioGroupItem
                value={card.id}
                className="sr-only"
              />

              <div
                className={cn(
                  "flex size-8 shrink-0 items-center justify-center rounded-lg",
                  isSelected
                    ? "bg-primary text-amber-950"
                    : "bg-slate-100 text-slate-600"
                )}
              >
                <CreditCard className="size-4" />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-black text-slate-800">
                    {getCardBrandLabel(card.brand)} ••••{" "}
                    {card.lastFourDigits}
                  </p>

                  {card.isDefault ? (
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-slate-500">
                      Padrão
                    </span>
                  ) : null}
                </div>

                {card.expMonth && card.expYear ? (
                  <p className="mt-0.5 text-xs font-semibold text-slate-500">
                    Validade{" "}
                    {String(card.expMonth).padStart(2, "0")}/
                    {String(card.expYear).slice(-2)}
                  </p>
                ) : null}
              </div>
            </label>
          );
        })}

        <label
          className={cn(
            "flex cursor-pointer items-center gap-4 rounded-2xl border bg-white px-4 py-2.5 transition",
            "hover:border-primary/50 hover:bg-primary/5",
            value?.type === "new_card"
              ? "border-primary bg-primary/10"
              : "border-slate-200"
          )}
        >
          <RadioGroupItem
            value="new_card"
            className="sr-only"
          />

          <div
            className={cn(
              "flex size-8 shrink-0 items-center justify-center rounded-lg",
              value?.type === "new_card"
                ? "bg-primary text-amber-950"
                : "bg-slate-100 text-slate-600"
            )}
          >
            <Plus className="size-4" />
          </div>

          <p className="text-sm font-bold text-slate-800">
            Adicionar novo cartão
          </p>
        </label>
      </RadioGroup>

      {cards.length === 0 && value?.type !== "new_card" ? (
        <p className="text-sm font-medium text-slate-500">
          Você ainda não possui cartões salvos.
        </p>
      ) : null}
    </div>
  );
}
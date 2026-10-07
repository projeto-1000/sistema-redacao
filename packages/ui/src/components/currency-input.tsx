"use client";

import type { ComponentProps } from "react";
import { formatCurrencyInput, parseCurrencyInput } from "@repo/utils";
import { Input } from "@repo/ui/components/input";
import { cn } from "@repo/ui/lib/utils";

interface CurrencyInputProps
  extends Omit<ComponentProps<typeof Input>, "value" | "onChange" | "type"> {
  value: number | null;
  onValueChange?: (cents: number | null) => void;
}

export function CurrencyInput({
  value,
  onValueChange,
  className,
  ...props
}: CurrencyInputProps) {
  return (
    <div className="relative">
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm font-semibold text-slate-500"
      >
        R$
      </span>
      <Input
        {...props}
        type="text"
        inputMode="numeric"
        placeholder="0,00"
        className={cn("pl-10 text-base font-semibold tabular-nums", className)}
        value={formatCurrencyInput(value)}
        onChange={(event) => {
          const cents = parseCurrencyInput(event.target.value);
          if (cents !== null || event.target.value === "")
            onValueChange?.(cents);
        }}
      />
    </div>
  );
}

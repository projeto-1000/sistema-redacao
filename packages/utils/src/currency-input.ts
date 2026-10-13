const currencyInputFormatter = new Intl.NumberFormat("pt-BR", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function formatCurrencyInput(cents: number | null): string {
  return cents === null ? "" : currencyInputFormatter.format(cents / 100);
}

// Bank-style input: digits shift from centavos, so 2000 displays as 20,00.
export function parseCurrencyInput(value: string): number | null {
  if (!/^(?:R\$\s*)?[\d.,\s]*$/.test(value)) return null;
  const digits = value.replace(/\D/g, "");
  if (!digits || digits.length > 12) return null;
  const cents = Number(digits);
  return Number.isSafeInteger(cents) ? cents : null;
}

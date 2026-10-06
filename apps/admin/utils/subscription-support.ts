export function parseRefundAmount(value: string): number | null {
  if (!/^\d+(?:[,.]\d{1,2})?$/.test(value.trim())) return null;
  const [whole, decimal = ""] = value.trim().replace(",", ".").split(".");
  const amount = Number(whole) * 100 + Number(decimal.padEnd(2, "0"));
  return Number.isSafeInteger(amount) ? amount : null;
}

export function courtesyDateToIso(value: string, periodEnd?: string): string | undefined {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return undefined;
  // The displayed day belongs to São Paulo, not to the administrator's device timezone.
  const date = new Date(`${value}T23:59:59-03:00`);
  if (
    Number.isNaN(date.getTime()) ||
    new Intl.DateTimeFormat("sv-SE", { timeZone: "America/Sao_Paulo" }).format(date) !== value
  )
    return undefined;
  if (
    periodEnd &&
    value ===
      new Intl.DateTimeFormat("sv-SE", { timeZone: "America/Sao_Paulo" }).format(
        new Date(periodEnd)
      )
  )
    return periodEnd;
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
}

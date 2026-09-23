const DATA_CRAZY_TIME_ZONE = "America/Sao_Paulo";

export function formatDataCrazyDateInSaoPaulo(value: string | Date): string {
  const date = typeof value === "string" ? new Date(value) : value;

  if (Number.isNaN(date.getTime())) {
    throw new RangeError("Invalid Data Crazy date");
  }

  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: DATA_CRAZY_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  const day = parts.find((part) => part.type === "day")?.value;

  if (!year || !month || !day) {
    throw new RangeError("Could not format Data Crazy date");
  }

  return `${year}-${month}-${day}`;
}

export function buildDataCrazyTokensExpirationField(
  expiresAt: string | null | undefined,
): { tokens_expire_at?: string } {
  return expiresAt
    ? { tokens_expire_at: formatDataCrazyDateInSaoPaulo(expiresAt) }
    : {};
}

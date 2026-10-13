import type { SubscriptionSupportAction } from "@repo/types";

export function getSupportConsequences({
  action,
  availableCredits,
  courtesyCredits,
  periodEndLabel,
  courtesyUntilLabel,
}: {
  action: SubscriptionSupportAction;
  availableCredits: number;
  courtesyCredits: number;
  periodEndLabel: string;
  courtesyUntilLabel: string;
}) {
  const credits = (count: number) => `${count} ${count === 1 ? "crédito" : "créditos"}`;
  switch (action) {
    case "cancel_refund":
      return {
        renewal: "Sem novas cobranças de renovação.",
        period: "Benefícios encerrados após a confirmação do reembolso.",
        credits: `${credits(availableCredits)} bloqueados ao iniciar; invalidados quando o reembolso for confirmado.`,
      };
    case "refund_courtesy":
      return {
        renewal: "Sem novas cobranças de renovação.",
        period: `Cortesia até ${courtesyUntilLabel}.`,
        credits: `${credits(courtesyCredits)} existentes mantidos; ${credits(Math.max(0, availableCredits - courtesyCredits))} bloqueados. Nenhum crédito novo.`,
      };
    case "cancel_only":
      return {
        renewal: "Sem novas cobranças de renovação.",
        period: `Plano disponível até ${periodEndLabel}.`,
        credits: `${credits(availableCredits)} mantidos até essa data, sem bloqueio.`,
      };
    case "refund_only":
      return {
        renewal: "Continua normalmente, com novas cobranças.",
        period: `Plano mantido; ciclo atual até ${periodEndLabel}.`,
        credits: `${credits(availableCredits)} mantidos, sem alteração de saldo ou validade.`,
      };
  }
}

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
  if (periodEnd && Number.isNaN(new Date(periodEnd).getTime())) return undefined;
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
}

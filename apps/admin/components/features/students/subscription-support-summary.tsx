import { SUBSCRIPTION_SUPPORT_ACTIONS } from "@/constants/subscription-support";
import type { SubscriptionSupportAction } from "@repo/types";
import { formatCurrency, formatDate } from "@repo/utils";

export function SubscriptionSupportSummary({
  action,
  amount,
  availableCredits,
  periodEnd,
  courtesyCredits,
  courtesyUntil,
}: {
  action: SubscriptionSupportAction;
  amount: number;
  availableCredits: number;
  periodEnd: string;
  courtesyCredits: number;
  courtesyUntil?: string;
}) {
  const keepsAccess = action === "cancel_only" || action === "refund_only";
  return (
    <div className="space-y-3 rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm text-slate-700">
      <h3 className="font-bold text-blue-800">O que vai acontecer</h3>
      <p className="font-semibold">{SUBSCRIPTION_SUPPORT_ACTIONS[action].label}</p>
      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2">
        <dt>Reembolso</dt>
        <dd className="font-semibold">{amount > 0 ? formatCurrency(amount) : "Sem reembolso"}</dd>
        <dt>Renovação</dt>
        <dd>{action === "refund_only" ? "Mantida normalmente" : "Interrompida"}</dd>
        <dt>Acesso</dt>
        <dd>
          {action === "refund_only"
            ? "Sem alteração"
            : action === "cancel_refund"
              ? "Encerrado"
              : `Até ${action === "refund_courtesy" ? courtesyUntil || "definir validade" : formatDate(periodEnd, "numeric")}`}
        </dd>
        <dt>Créditos do plano</dt>
        <dd>
          {action === "cancel_refund"
            ? `${availableCredits} bloqueados; invalidados após confirmação`
            : action === "refund_courtesy"
              ? `${courtesyCredits} mantidos como cortesia`
              : `${availableCredits} mantidos${keepsAccess ? " até a validade do plano" : ""}`}
        </dd>
      </dl>
      <p className="border-t border-blue-100 pt-3 text-xs">
        Créditos extras, gratuitos e de mentoria não são alterados. A ação e o administrador
        responsável serão registrados no histórico.
      </p>
    </div>
  );
}

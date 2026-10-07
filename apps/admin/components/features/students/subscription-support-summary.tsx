import { SUBSCRIPTION_SUPPORT_ACTIONS } from "@/constants/subscription-support";
import { getSupportConsequences } from "@/utils/subscription-support";
import type {
  SubscriptionSupportAction,
  SubscriptionSupportContext,
  SubscriptionSupportPayment,
} from "@repo/types";
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/components/card";
import { Badge } from "@repo/ui/components/badge";
import { ClipboardList } from "lucide-react";
import { formatCurrency, formatDate, getSubscriptionAccessEnd } from "@repo/utils";

export function SubscriptionSupportSummary({
  action,
  amount,
  context,
  payment,
  reason,
  courtesyCredits,
  courtesyUntil,
}: {
  action: SubscriptionSupportAction;
  amount: number;
  context: SubscriptionSupportContext;
  payment?: SubscriptionSupportPayment;
  reason: string;
  courtesyCredits: number;
  courtesyUntil?: string;
}) {
  const effects = getSupportConsequences({
    action,
    availableCredits: context.availableCredits,
    courtesyCredits,
    periodEndLabel: formatDate(
      action === "cancel_only" ? getSubscriptionAccessEnd(context.periodEnd) : context.periodEnd,
      "date-time"
    ),
    courtesyUntilLabel: courtesyUntil
      ? formatDate(`${courtesyUntil}T12:00:00-03:00`, "numeric")
      : "a validade a definir",
  });
  const hasRefund = action !== "cancel_only";
  const partial = hasRefund && payment && amount < payment.amount;
  return (
    <Card className="shrink-0 gap-0 overflow-hidden border-blue-100 bg-blue-50 py-0 text-slate-700 shadow-none">
      <CardHeader className="flex flex-row items-center justify-between gap-3 border-b border-blue-100 px-4 py-3">
        <CardTitle className="flex min-w-0 items-center gap-2 text-base font-bold text-blue-800">
          <ClipboardList className="size-5 shrink-0" />
          {SUBSCRIPTION_SUPPORT_ACTIONS[action].label}
        </CardTitle>
        <Badge variant="secondary" className="shrink-0 bg-white text-blue-700">
          {hasRefund ? (partial ? "Reembolso parcial" : "Reembolso integral") : "Sem reembolso"}
        </Badge>
      </CardHeader>
      <CardContent className="divide-y divide-blue-100 px-4 text-sm">
        <section className="py-3" aria-label="Pagamento e reembolso">
          <dl className="grid grid-cols-[minmax(0,0.8fr)_minmax(0,1.5fr)] gap-x-3 gap-y-2 [&>dd]:min-w-0 [&>dd]:break-words">
            {hasRefund && (
              <>
                <dt className="text-slate-500">Pagamento</dt>
                <dd>
                  {payment ? (
                    <>
                      {formatCurrency(payment.amount)}
                      <span className="text-slate-500">
                        {" · "}
                        {formatDate(payment.paid_at, "numeric")}
                      </span>
                    </>
                  ) : (
                    "Cobrança não selecionada"
                  )}
                </dd>
              </>
            )}
            <dt className="text-slate-500">Valor a devolver</dt>
            <dd className="font-bold text-blue-800">
              {hasRefund
                ? amount > 0
                  ? formatCurrency(amount)
                  : "Informe o valor"
                : "Sem reembolso"}
            </dd>
          </dl>
        </section>
        <section className="space-y-3 py-3" aria-label="Consequências do atendimento">
          <dl className="grid grid-cols-[minmax(0,0.8fr)_minmax(0,1.5fr)] gap-x-3 gap-y-2 [&>dd]:min-w-0">
            <dt className="text-slate-500">Renovação</dt>
            <dd>{effects.renewal}</dd>
            <dt className="text-slate-500">Benefícios do plano</dt>
            <dd>{effects.period}</dd>
            <dt className="text-slate-500">Créditos do plano</dt>
            <dd>{effects.credits}</dd>
          </dl>
          <p className="text-xs text-slate-500">
            Conta, histórico e créditos extras, gratuitos e de mentoria não mudam.
          </p>
        </section>
        <section className="space-y-2 py-3" aria-label="Justificativa do atendimento">
          <h4 className="font-semibold">
            Justificativa <span className="font-normal text-slate-500">· visível ao aluno</span>
          </h4>
          <p className="break-words whitespace-pre-wrap">
            {reason.trim() || "Preencha o motivo do atendimento para continuar."}
          </p>
          <p className="text-xs text-slate-500">
            A ação será registrada no histórico
            {hasRefund ? "; reembolso concluído somente após confirmação da Pagar.me." : "."}
          </p>
        </section>
      </CardContent>
    </Card>
  );
}

import {
  approveSubscriptionWithdrawal,
  listSubscriptionWithdrawals,
  reconcileSubscriptionWithdrawal,
  rejectSubscriptionWithdrawal,
} from "@/app/actions/subscription-withdrawals";
import { SubscriptionWithdrawalSubmitButton } from "@/components/subscription-withdrawal-submit-button";
import { Button } from "@repo/ui/components/button";
import { Input } from "@repo/ui/components/input";
import { PageHeader } from "@repo/ui/components/page-header";
import { subscriptionCancellationReasons } from "@repo/constants";
import { formatDate } from "@repo/utils";
import { CheckCircle2, ChevronDown, CircleAlert, Clock3, UserRoundCheck, Zap } from "lucide-react";

const WITHDRAWALS_TABLE_GRID =
  "lg:grid-cols-[minmax(0,2.15fr)_minmax(0,1.45fr)_minmax(0,1.55fr)_2.5rem]";

const cancellationReasonMap = new Map(
  subscriptionCancellationReasons.map((reason) => [reason.value, reason])
);

const statusConfig: Record<
  string,
  { label: string; detail: string; classes: string; icon: typeof CheckCircle2 }
> = {
  under_review: {
    label: "Aguardando decisão",
    detail: "O administrador precisa analisar o pedido.",
    classes: "bg-amber-50 text-amber-700",
    icon: Clock3,
  },
  refund_processing: {
    label: "Reembolso em processamento",
    detail: "Aguardando a confirmação do meio de pagamento.",
    classes: "bg-blue-50 text-blue-700",
    icon: Clock3,
  },
  refunded: {
    label: "Reembolso concluído",
    detail: "Assinatura cancelada e valor reembolsado.",
    classes: "bg-emerald-50 text-emerald-700",
    icon: CheckCircle2,
  },
  rejected: {
    label: "Pedido recusado",
    detail: "A assinatura foi mantida ativa.",
    classes: "bg-slate-100 text-slate-600",
    icon: CircleAlert,
  },
  operational_issue: {
    label: "Falha operacional",
    detail: "É necessário tentar o processamento novamente.",
    classes: "bg-red-50 text-red-700",
    icon: CircleAlert,
  },
};

function formatDateTime(value: string | null) {
  if (!value) {
    return null;
  }

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "America/Sao_Paulo",
  }).format(new Date(value));
}

function getCancellationReason(value: string | null) {
  if (!value) {
    return {
      label: "Não informado",
      adminDescription: "O aluno preferiu não informar o motivo do cancelamento.",
    };
  }

  return (
    cancellationReasonMap.get(
      value as (typeof subscriptionCancellationReasons)[number]["value"]
    ) ?? {
      label: value,
      adminDescription: "Motivo registrado pelo aluno.",
    }
  );
}

export default async function SubscriptionWithdrawalsPage() {
  const requests = await listSubscriptionWithdrawals();

  return (
    <div className="min-h-dvh space-y-6 px-2 py-4 md:px-10 lg:px-12">
      <PageHeader
        title="Cancelamentos e reembolsos"
        subtitle="Acompanhe solicitações e resolva somente os casos que precisam de ação."
      />

      {requests.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">
          Nenhum pedido de cancelamento foi registrado.
        </div>
      ) : (
        <section className="overflow-hidden rounded-4xl border border-slate-200 bg-white shadow-sm">
          <div
            className={`hidden items-center border-b border-slate-100 bg-slate-50/50 px-6 py-5 lg:grid lg:gap-4 ${WITHDRAWALS_TABLE_GRID}`}
          >
            <div className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">
              Aluno e solicitação
            </div>
            <div className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">
              Data do processamento
            </div>
            <div className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">
              Status
            </div>
            <span className="sr-only">Detalhes</span>
          </div>

          <div className="divide-y divide-slate-100">
            {requests.map((request) => {
              const profile = request.profiles as unknown as {
                full_name: string;
                email: string;
              } | null;
              const reviewer = request.reviewer as unknown as {
                full_name: string;
                email: string;
              } | null;
              const subscription = request.subscriptions as unknown as {
                plans: { name: string } | null;
              } | null;
              const canReview =
                request.processing_mode === "manual" &&
                request.reviewed_at === null &&
                ["under_review", "operational_issue"].includes(request.status);
              const canRetry =
                request.status === "operational_issue" &&
                (request.processing_mode === "automatic" || request.reviewed_at !== null);
              const canReconcile = request.status === "refund_processing";
              const status = statusConfig[request.status] ?? {
                label: request.status,
                detail: "Status do pedido.",
                classes: "bg-slate-100 text-slate-600",
                icon: CircleAlert,
              };
              const StatusIcon = status.icon;
              const isAutomatic = request.processing_mode === "automatic";
              const processing = isAutomatic
                ? {
                  label: "Fluxo automático",
                  detail: "Dentro do prazo de 7 dias",
                  classes: "bg-blue-50 text-blue-700",
                }
                : {
                  label: "Revisão manual",
                  detail: request.reviewed_at
                    ? "Decisão administrativa registrada"
                    : `Solicitação nº ${request.request_number} deste aluno`,
                  classes: "bg-amber-50 text-amber-700",
                };
              const adminDecision = request.reviewed_at
                ? request.status === "rejected"
                  ? "Recusado pelo administrador"
                  : "Aprovado pelo administrador"
                : isAutomatic
                  ? "Sem intervenção"
                  : "Aguardando decisão";
              const reviewedAt = formatDateTime(request.reviewed_at);
              const refundStartedAt = formatDateTime(request.refund_started_at);
              const completedAt = formatDateTime(request.refund_completed_at);
              const locallyProcessedAt = formatDateTime(request.updated_at);
              const failureAt = formatDateTime(request.failure_at);
              const processedAt =
                request.status === "refunded"
                  ? locallyProcessedAt
                  : request.status === "rejected"
                    ? reviewedAt
                    : request.status === "operational_issue"
                      ? failureAt
                      : request.status === "refund_processing"
                        ? (refundStartedAt ?? reviewedAt)
                        : null;
              const cancellationReason = getCancellationReason(request.cancellation_reason);
              const showAdminSection =
                !isAutomatic || request.reviewed_at !== null || canRetry || canReconcile;

              return (
                <details key={request.id} className="group">
                  <summary
                    className={`grid cursor-pointer list-none grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-4 px-5 py-5 transition-colors hover:bg-slate-50/60 lg:gap-4 lg:px-6 [&::-webkit-details-marker]:hidden ${WITHDRAWALS_TABLE_GRID}`}
                  >
                    <div className="min-w-0">
                      <span className="block truncate text-sm font-bold text-slate-800">
                        {profile?.full_name ?? "Aluno"}
                      </span>
                      <span className="mt-1 block text-xs text-slate-500">
                        {profile?.email ?? "E-mail não disponível"}
                      </span>
                      <span className="mt-1 block truncate text-xs text-slate-500">
                        ID: {request.student_id}
                      </span>
                      <span className="mt-1 block text-xs font-medium text-slate-600">
                        Plano: {subscription?.plans?.name ?? "Não encontrado"}
                      </span>
                      <span className="mt-1 block text-xs text-slate-500">
                        Solicitado em {formatDateTime(request.requested_at)}
                      </span>
                    </div>

                    <div className="col-span-2 lg:col-span-1">
                      {processedAt ? (
                        <>
                          <span className="mb-1 block text-[10px] font-bold tracking-widest text-slate-400 uppercase lg:hidden">
                            Data do processamento
                          </span>
                          <span className="block text-sm font-bold text-slate-700">
                            {processedAt}
                          </span>
                        </>
                      ) : null}
                      <span
                        className={`${processedAt ? "mt-2 " : ""}inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-bold ${processing.classes}`}
                      >
                        {isAutomatic ? (
                          <Zap className="size-3.5" />
                        ) : (
                          <UserRoundCheck className="size-3.5" />
                        )}
                        {processing.label}
                      </span>
                      <span className="mt-1.5 block text-xs text-slate-500">
                        {processing.detail}
                      </span>
                    </div>

                    <div className="col-span-2 lg:col-span-1">
                      <span className="mb-1 block text-[10px] font-bold tracking-widest text-slate-400 uppercase lg:hidden">
                        Status
                      </span>
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-black tracking-wide uppercase ${status.classes}`}
                      >
                        <StatusIcon className="size-3.5" />
                        {status.label}
                      </span>
                      <span className="mt-1.5 block text-xs leading-snug text-slate-500">
                        {status.detail}
                      </span>
                    </div>

                    <span className="flex size-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition-colors group-open:bg-slate-100">
                      <ChevronDown className="size-4 transition-transform group-open:rotate-180" />
                    </span>
                  </summary>

                  <div className="border-t border-slate-100 bg-slate-50/60 px-5 py-5 lg:px-6">
                    <div
                      className={`grid gap-6 ${showAdminSection
                        ? "lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(320px,1.15fr)]"
                        : "lg:grid-cols-2"
                        }`}
                    >
                      <div className="space-y-4">
                        <div>
                          <span className="block text-[10px] font-bold tracking-widest text-slate-400 uppercase">
                            Dados da solicitação
                          </span>
                          <p className="mt-2 text-sm font-semibold text-slate-700">
                            Pedido #{request.request_number} em{" "}
                            {formatDate(request.requested_at, "numeric")}
                          </p>
                          <p className="mt-1 text-xs text-slate-500">
                            {profile?.email ?? "E-mail não disponível"} ·{" "}
                            {request.blocked_plan_credits} crédito(s) bloqueado(s)
                          </p>
                          <p className="mt-1 truncate text-xs text-slate-500">
                            ID do aluno: {request.student_id}
                          </p>
                        </div>
                        <div>
                          <span className="block text-[10px] font-bold tracking-widest text-slate-400 uppercase">
                            Motivo informado pelo aluno
                          </span>
                          <div className="mt-2 rounded-xl border border-slate-200 bg-white px-3 py-3">
                            <p className="text-sm font-semibold text-slate-700">
                              {cancellationReason.label}
                            </p>
                            <p className="mt-1 text-xs leading-relaxed text-slate-500">
                              {cancellationReason.adminDescription}
                            </p>
                            {request.cancellation_details && (
                              <div className="mt-3 border-t border-slate-100 pt-3">
                                <span className="block text-[10px] font-bold tracking-wide text-slate-400 uppercase">
                                  Detalhes adicionais
                                </span>
                                <p className="mt-1 text-sm leading-relaxed text-slate-700">
                                  {request.cancellation_details}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      <div>
                        <span className="block text-[10px] font-bold tracking-widest text-slate-400 uppercase">
                          Histórico do processamento
                        </span>
                        <div className="relative mt-3 space-y-5 pl-7 text-sm text-slate-700">
                          <span className="absolute top-2 bottom-2 left-[5px] w-px bg-slate-200" />
                          <div className="relative">
                            <span className="absolute top-1 -left-7 size-3 rounded-full border-[3px] border-blue-500 bg-white" />
                            <p className="font-semibold">Solicitação recebida</p>
                            <p className="mt-0.5 text-xs text-slate-500">
                              {formatDateTime(request.requested_at)}
                            </p>
                          </div>
                          {reviewedAt && (
                            <div className="relative">
                              <span className="absolute top-1 -left-7 size-3 rounded-full border-[3px] border-amber-500 bg-white" />
                              <p className="font-semibold">Decisão administrativa registrada</p>
                              <p className="mt-0.5 text-xs text-slate-500">{reviewedAt}</p>
                            </div>
                          )}
                          {refundStartedAt && request.status !== "rejected" && (
                            <div className="relative">
                              <span className="absolute top-1 -left-7 size-3 rounded-full border-[3px] border-blue-500 bg-white" />
                              <p className="font-semibold">
                                {isAutomatic
                                  ? "Processamento automático iniciado"
                                  : "Reembolso iniciado"}
                              </p>
                              <p className="mt-0.5 text-xs text-slate-500">
                                {refundStartedAt}
                                {isAutomatic ? " · Dentro do prazo de 7 dias" : ""}
                              </p>
                            </div>
                          )}
                          {failureAt && (
                            <div className="relative">
                              <span className="absolute top-1 -left-7 size-3 rounded-full border-[3px] border-red-500 bg-white" />
                              <p className="font-semibold text-red-700">
                                Falha operacional registrada
                              </p>
                              <p className="mt-0.5 text-xs text-slate-500">{failureAt}</p>
                            </div>
                          )}
                          {completedAt && (
                            <div className="relative">
                              <span className="absolute top-1 -left-7 size-3 rounded-full border-[3px] border-emerald-500 bg-white" />
                              <p className="font-semibold text-emerald-700">
                                Reembolso confirmado no sistema
                              </p>
                              <p className="mt-0.5 text-xs text-slate-500">
                                {locallyProcessedAt ?? completedAt}
                              </p>
                              {locallyProcessedAt && locallyProcessedAt !== completedAt && (
                                <p className="mt-1 text-xs text-slate-500">
                                  Estorno informado pelo meio de pagamento em {completedAt}
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                        {request.failure_message && (
                          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
                            <span className="font-semibold">Falha operacional:</span>{" "}
                            {request.failure_message}
                          </div>
                        )}
                      </div>

                      {showAdminSection && (
                        <div className="border-t border-slate-200 pt-5 lg:border-t-0 lg:border-l lg:pt-0 lg:pl-6">
                          <span className="block text-[10px] font-bold tracking-widest text-slate-400 uppercase">
                            Ação administrativa
                          </span>

                          {canReconcile ? (
                            <div className="mt-2">
                              <p className="text-sm leading-relaxed text-slate-600">
                                O reembolso foi solicitado e aguarda a confirmação do meio de
                                pagamento. Se a confirmação já ocorreu, sincronize o status abaixo.
                              </p>
                              <form action={reconcileSubscriptionWithdrawal} className="mt-3">
                                <input type="hidden" name="requestId" value={request.id} />
                                <SubscriptionWithdrawalSubmitButton isRetry={false} isReconcile />
                              </form>
                            </div>
                          ) : request.reviewed_at ? (
                            <div className="mt-2">
                              <p className="text-sm font-bold text-slate-700">{adminDecision}</p>
                              <p className="mt-1 text-xs text-slate-500">
                                Por {reviewer?.full_name ?? "Administrador"} em {reviewedAt}
                              </p>
                              <p className="mt-3 rounded-xl bg-white px-3 py-2 text-sm text-slate-600 border border-slate-200">
                                {request.review_reason || "Nenhuma observação foi registrada."}
                              </p>
                            </div>
                          ) : isAutomatic && canRetry ? (
                            <p className="mt-2 text-sm leading-relaxed text-slate-600">
                              O fluxo automático encontrou uma falha. Um administrador pode tentar
                              concluir novamente apenas a etapa financeira.
                            </p>
                          ) : canReview ? (
                            <div className="mt-3 grid gap-3">
                              <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-3 text-amber-900">
                                <p className="text-sm font-bold">
                                  Por que este pedido exige análise?
                                </p>
                                <p className="mt-1 text-xs leading-relaxed">
                                  Esta é a solicitação de arrependimento nº {request.request_number}{" "}
                                  deste aluno. Apenas a primeira solicitação dentro do prazo de 7
                                  dias é processada automaticamente; as seguintes precisam de uma
                                  decisão administrativa.
                                </p>
                              </div>
                              <form action={approveSubscriptionWithdrawal} className="space-y-2">
                                <input type="hidden" name="requestId" value={request.id} />
                                <Input
                                  name="reason"
                                  placeholder="Observação da aprovação (opcional)"
                                />
                                <SubscriptionWithdrawalSubmitButton isRetry={false} />
                              </form>
                              <form action={rejectSubscriptionWithdrawal} className="space-y-2">
                                <input type="hidden" name="requestId" value={request.id} />
                                <Input name="reason" required placeholder="Motivo da recusa" />
                                <Button type="submit" variant="outline" className="w-full">
                                  Recusar pedido
                                </Button>
                              </form>
                            </div>
                          ) : (
                            <p className="mt-2 text-sm text-slate-600">Nenhuma ação disponível.</p>
                          )}

                          {canRetry && (
                            <div className="mt-5 border-t border-slate-200 pt-4">
                              <p className="text-sm font-semibold text-slate-700">
                                Reprocessar reembolso
                              </p>
                              <p className="mt-1 text-xs leading-relaxed text-slate-500">
                                A decisão anterior será mantida no histórico. Esta ação tentará
                                concluir apenas a etapa financeira.
                              </p>
                              <form
                                action={approveSubscriptionWithdrawal}
                                className="mt-3 space-y-2"
                              >
                                <input type="hidden" name="requestId" value={request.id} />
                                <Input
                                  name="reason"
                                  placeholder="Observação da tentativa (opcional)"
                                />
                                <SubscriptionWithdrawalSubmitButton isRetry />
                              </form>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </details>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}

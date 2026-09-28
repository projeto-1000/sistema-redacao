import {
  approveSubscriptionWithdrawal,
  listSubscriptionWithdrawals,
  rejectSubscriptionWithdrawal,
} from "@/app/actions/subscription-withdrawals";
import { Badge } from "@repo/ui/components/badge";
import { Button } from "@repo/ui/components/button";
import { Input } from "@repo/ui/components/input";
import { PageHeader } from "@repo/ui/components/page-header";
import { formatDate } from "@repo/utils";

const statusLabels: Record<string, string> = {
  under_review: "Em análise",
  refund_processing: "Reembolso processando",
  refunded: "Concluído",
  rejected: "Recusado",
  operational_issue: "Pendência operacional",
};

export default async function SubscriptionWithdrawalsPage() {
  const requests = await listSubscriptionWithdrawals();

  return (
    <div className="min-h-dvh space-y-6 px-2 py-4 md:px-10 lg:px-12">
      <PageHeader
        title="Cancelamentos e reembolsos"
        subtitle="Analise pedidos recorrentes e acompanhe a confirmação dos reembolsos."
      />

      <div className="space-y-4">
        {requests.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">
            Nenhum pedido de arrependimento foi registrado.
          </div>
        ) : (
          requests.map((request) => {
            const profile = request.profiles as unknown as {
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

            return (
              <article
                key={request.id}
                className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
              >
                <div className="flex flex-col justify-between gap-4 lg:flex-row">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-lg font-bold text-slate-950">
                        {profile?.full_name ?? "Aluno"}
                      </h2>
                      <Badge variant="secondary">
                        {statusLabels[request.status] ?? request.status}
                      </Badge>
                      <Badge variant="outline">
                        {request.processing_mode === "automatic" ? "Automático" : "Análise manual"}
                      </Badge>
                    </div>

                    <p className="text-sm text-slate-500">
                      {profile?.email ?? "E-mail não disponível"} · {subscription?.plans?.name ?? "Plano não encontrado"}
                    </p>

                    <p className="text-sm text-slate-600">
                      Pedido #{request.request_number} em {formatDate(request.requested_at, "numeric")} · {request.blocked_plan_credits} crédito(s) do plano bloqueado(s)
                    </p>

                    {request.failure_message && (
                      <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
                        {request.failure_stage ? `${request.failure_stage}: ` : ""}
                        {request.failure_message}
                      </p>
                    )}
                  </div>

                  {(canReview || canRetry) && (
                    <div className="grid w-full gap-3 lg:max-w-xl lg:grid-cols-2">
                      <form action={approveSubscriptionWithdrawal} className="space-y-2">
                        <input type="hidden" name="requestId" value={request.id} />
                        <Input name="reason" placeholder="Observação da aprovação (opcional)" />
                        <Button type="submit" className="w-full">
                          {canRetry ? "Tentar reembolso novamente" : "Aprovar e reembolsar"}
                        </Button>
                      </form>

                      {canReview && (
                        <form action={rejectSubscriptionWithdrawal} className="space-y-2">
                          <input type="hidden" name="requestId" value={request.id} />
                          <Input name="reason" required placeholder="Motivo da recusa" />
                          <Button type="submit" variant="outline" className="w-full">
                            Recusar pedido
                          </Button>
                        </form>
                      )}
                    </div>
                  )}
                </div>
              </article>
            );
          })
        )}
      </div>
    </div>
  );
}

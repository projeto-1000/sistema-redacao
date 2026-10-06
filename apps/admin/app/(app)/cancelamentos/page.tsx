import { listCancellationHistory } from "@/app/actions/subscription-withdrawals";
import { CancellationHistory } from "@/components/cancellation-history";
import { PageHeader } from "@repo/ui/components/page-header";

export default async function SubscriptionWithdrawalsPage() {
  let entries;
  let errorMessage: string | null = null;
  try {
    entries = await listCancellationHistory();
  } catch (error) {
    errorMessage = error instanceof Error ? error.message : "Não foi possível carregar o histórico.";
  }
  return (
    <div className="min-h-dvh space-y-6 px-2 py-4 md:px-10 lg:px-12">
      <PageHeader
        title="Cancelamentos e reembolsos"
        subtitle="Consulta de solicitações e histórico por aluno."
      />
      {errorMessage ? (
        <div role="alert" className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-900">
          {errorMessage}
        </div>
      ) : (
        <CancellationHistory entries={entries ?? []} />
      )}
    </div>
  );
}

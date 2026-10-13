import { CancellationHistoryTable } from "@/components/features/cancellations/cancellation-history-table";
import { PageHeader } from "@repo/ui/components/page-header";

export default function SubscriptionWithdrawalsPage() {
  return (
    <div className="min-h-dvh space-y-6 px-2 py-4 md:px-10 lg:px-12">
      <PageHeader
        title="Cancelamentos e reembolsos"
        subtitle="Consulta de solicitações e histórico por aluno."
      />
      <CancellationHistoryTable />
    </div>
  );
}

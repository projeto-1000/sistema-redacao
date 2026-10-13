import { CreatePlanDialog } from "@/components/features/plans/create-plan-dialog";
import { PlansTable } from "@/components/features/plans/plans-table";
import { PageHeader } from "@repo/ui/components/page-header";
import { Skeleton } from "@repo/ui/components/skeleton";
import { Suspense } from "react";

export default function PlansManagementPage() {
  return (
    <div className="min-h-dvh space-y-4 px-2 py-4 md:px-10 lg:px-12">
      <PageHeader
        title="Gestão de Planos"
        subtitle="Cadastro de novos planos e gestão dos existentes"
      >
        <CreatePlanDialog />
      </PageHeader>

      <Suspense fallback={<Skeleton className="min-h-[200px] rounded-3xl bg-slate-200" />}>
        <PlansTable />
      </Suspense>
    </div>
  );
}

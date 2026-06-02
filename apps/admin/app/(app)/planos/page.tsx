import { CreatePlanDialog } from "@/components/features/plans/create-plan-dialog";
import { PlansTable } from "@/components/features/plans/plans-table";
import { PageHeader } from "@repo/ui/components/page-header";
import { Skeleton } from "@repo/ui/components/skeleton";
import { Suspense } from "react";

export default function PlansManagementPage() {

  return (
    <div className="min-h-dvh px-2 md:px-10 lg:px-12 py-4 space-y-4">
      <PageHeader
        title="Gestão de Planos"
        subtitle="Cadastro de novos planos e gestão dos existentes"
      >
        <CreatePlanDialog />
      </PageHeader>

      <Suspense fallback={<Skeleton className="rounded-3xl min-h-[200px] bg-slate-200" />}>
        <PlansTable />
      </Suspense>
    </div>
  );
}
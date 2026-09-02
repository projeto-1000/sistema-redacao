import { CreateExtraCreditPackageDialog } from "@/components/features/extra-credit-packages/create-extra-credit-package-dialog";
import { ExtraCreditPackagesTable } from "@/components/features/extra-credit-packages/extra-credit-packages-table";
import { PageHeader } from "@repo/ui/components/page-header";
import { Skeleton } from "@repo/ui/components/skeleton";
import { Suspense } from "react";

export default function ExtraCreditPackagesManagementPage() {
  return (
    <div className="min-h-dvh space-y-4 px-2 py-4 md:px-10 lg:px-12">
      <PageHeader
        title="Pacotes de Créditos Extras"
        subtitle="Cadastro e gestão dos pacotes de créditos extras disponíveis para os alunos"
      >
        <CreateExtraCreditPackageDialog />
      </PageHeader>

      <Suspense
        fallback={
          <Skeleton className="min-h-[200px] rounded-3xl bg-slate-200" />
        }
      >
        <ExtraCreditPackagesTable />
      </Suspense>
    </div>
  );
}
import { PlansTable } from "@/components/features/plans/plans-table";
import { Button } from "@repo/ui/components/button";
import { PageHeader } from "@repo/ui/components/page-header";
import { Plus } from "lucide-react";

export default function PlansManagementPage() {


  return (
    <div className="min-h-dvh px-2 md:px-10 lg:px-12 py-4 space-y-4">

      <PageHeader
        variant="secondary"
        title="Gestão de Planos"
        subtitle="Cadastro de novos planos e gestão dos existentes"
      >
        <Button className="rounded-xl font-bold h-10 w-full sm:w-fit" variant="secondary">
          <Plus className="size-4 mr-2" />
          Adicionar Novo Plano
        </Button>
      </PageHeader>


      <PlansTable />
    </div>
  );
}
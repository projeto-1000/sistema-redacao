import { getCorrectionRatesManagementData } from "@/app/actions/teacher-correction-rates";
import { CorrectionRatesManager } from "@/components/features/teacher-correction-rates/correction-rates-manager";
import { TeacherManagementTabs } from "@/components/teacher-management-tabs";
import { PageHeader } from "@repo/ui/components/page-header";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Valores de correção" };

export default async function TeacherCorrectionRatesPage() {
  const data = await getCorrectionRatesManagementData();

  return (
    <div className="min-h-dvh space-y-6 px-4 py-4 md:px-10 lg:px-12">
      <PageHeader title="Gestão de Professores" subtitle="Gerencie sua equipe docente e os valores por correção." />
      <TeacherManagementTabs active="rates" />
      <div>
        <h1 className="text-3xl font-black tracking-tight text-slate-900">Valores de correção</h1>
        <p className="mt-1 font-medium text-slate-500">Defina o valor padrão e gerencie exceções por professor.</p>
      </div>
      <CorrectionRatesManager data={data} />
    </div>
  );
}

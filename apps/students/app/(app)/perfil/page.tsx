import { CompetenceList } from "@/components/competence-list";
import { EvolutionGraph } from "@/components/evolution-graph";

import { SectionCard } from "@/components/section-card";
import { UserStats } from "@/components/user-stats";
import { getProfileData } from "@/app/actions/profile";
import { FileText, TrendingUp } from "lucide-react";
import { redirect } from "next/navigation";
import { PageHeader } from "@repo/ui/components/page-header";
import { ProfileHeader } from "@repo/ui/components/profile-header";
import { CreditsCard } from "@/components/credits-card";

export default async function ProfilePage() {
  const data = await getProfileData();

  if (!data) {
    redirect("/login");
  }

  const { user, globalStats, competencies, evolution, hasData } = data

  return (
    <div className="min-h-dvh px-4 md:px-10 lg:px-12 py-4 space-y-6">

      <ProfileHeader
        user={user}
        creditBalanceComponent={
          <CreditsCard credits={user.credits} />
        }
        secondaryAction={{
          label: "Gerenciar assinatura",
          href: "/checkout/upgrade"
        }} />

      <PageHeader
        title='Meu perfil'
        subtitle='Acompanhe seu progresso e gerencie suas informações.'
      />
      <UserStats stats={globalStats} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-6">
        <SectionCard
          title="Média por Competência"
          icon={FileText}
          hasData={hasData}
          emptyDescription="Envie sua primeira redação para ver o detalhamento por competência."
        >
          <CompetenceList scores={competencies} />
        </SectionCard>

        <SectionCard
          title="Evolução no Tempo"
          icon={TrendingUp}
          hasData={hasData}
          emptyDescription="Seu gráfico de progresso será gerado automaticamente."
        >
          <EvolutionGraph data={evolution} />
        </SectionCard>
      </div>
    </div>
  );
}
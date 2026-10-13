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
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Meu Perfil",
};

export default async function ProfilePage() {
  const data = await getProfileData();

  if (!data) {
    redirect("/login");
  }

  const { user, credits, globalStats, competencies, evolution, hasData } = data;

  return (
    <div className="min-h-dvh space-y-6 px-4 py-4 md:px-10 lg:px-12">
      <ProfileHeader
        user={user}
        creditBalanceComponent={<CreditsCard credits={credits} />}
        secondaryAction={{
          label: "Gerenciar assinatura",
          href: "/assinatura",
        }}
      />

      <PageHeader
        title="Meu perfil"
        subtitle="Acompanhe seu progresso e gerencie suas informações."
      />

      <UserStats stats={globalStats} />

      <div className="my-6 grid grid-cols-1 gap-6 md:grid-cols-2">
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

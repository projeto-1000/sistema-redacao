import { CompetenceList } from "@/components/competence-list";
import { EvolutionGraph } from "@/components/evolution-graph";
import { ProfileHeader } from "@/components/profile-header";
import { SectionCard } from "@/components/section-card";
import { UserStats } from "@/components/user-stats";
import { getProfileData } from "@/app/actions/profile";
import { FileText, TrendingUp } from "lucide-react";
import { redirect } from "next/navigation";

export default async function ProfilePage() {
  const data = await getProfileData();

  if (!data) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen px-2 md:px-10 lg:px-12 py-4">

      <ProfileHeader user={data.user} />

      <div className="my-6">
        <h2 className="text-3xl font-extrabold tracking-tight mb-2">
          Minhas Estatísticas
        </h2>
        <p className="text-[#8B8265]">
          Acompanhe seu progresso.
        </p>
      </div>

      <UserStats stats={data.globalStats} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-6">
        <SectionCard
          title="Média por Competência"
          icon={FileText}
          hasData={data.hasData}
          emptyDescription="Envie sua primeira redação para ver o detalhamento por competência."
        >
          <CompetenceList scores={data.competencies} />
        </SectionCard>

        <SectionCard
          title="Evolução no Tempo"
          icon={TrendingUp}
          hasData={data.hasData}
          emptyDescription="Seu gráfico de progresso será gerado automaticamente."
        >
          <EvolutionGraph data={data.evolution} />
        </SectionCard>
      </div>
    </div>
  );
}
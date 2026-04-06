import { CreditBalance } from "@/components/credit-balance";
import { StatCard } from "@/components/stat-card";
import { BookOpen, FileCheck, FileText, NotebookPen, TrendingUp } from "lucide-react";
import { SectionCard } from "@/components/section-card";
import { CompetenceList } from "@/components/competence-list";
import { EvolutionGraph } from "@/components/evolution-graph";
import { RecentEssaysList } from "@/components/recent-essays-list";
import { getDashboardData } from "@/services/get-dashboard-data";
import { ActionCard } from "@/components/action-card";

export default async function DashboardPage() {
  const data = await getDashboardData();

  if (!data) return null;

  const actions = [
    {
      title: "Enviar Nova Redação",
      description: "Escolha um tema ou envie um texto livre para correção imediata.",
      buttonText: "Começar Agora",
      icon: NotebookPen,
      variant: "primary" as const,
      href: '/temas'
    },
    {
      title: "Ver Temas Disponíveis",
      description: "Explore centenas de propostas de redação nos moldes do ENEM.",
      buttonText: "Explorar Temas",
      icon: BookOpen,
      variant: "secondary" as const,
      href: '/temas'
    },
    {
      title: "Minhas Redações",
      description: "Acesse seus feedbacks detalhados e acompanhe suas notas.",
      buttonText: "Ver Histórico",
      icon: FileCheck,
      variant: "dark" as const,
      href: '/minhas-redacoes'
    },
  ];

  return (
    <div className="space-y-8 px-4 md:px-10 lg:px-12 py-4">

      <div className="flex flex-col md:flex-row justify-between items-center gap-6 bg-red">
        <div className="flex flex-col text-center md:text-left">
          <h1 className="text-3xl font-bold tracking-tight">
            Olá, {data.user.firstName}!
          </h1>
          <p className="text-slate-500 text-md mt-1">
            Vamos escrever sua próxima redação nota 1000?
          </p>
        </div>

        <CreditBalance amount={data.user.credits} />

      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        {actions.map((action, index) => (
          <ActionCard key={index} {...action} />
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <StatCard
          title="Média Geral"
          value={data.metrics.hasData ? data.metrics.averageScore : 0}
          variant="yellow"
        />
        <StatCard
          title="Última Nota"
          value={data.metrics.lastScore}
          variant="blue"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <SectionCard
          title="Média por Competência"
          icon={FileText}
          hasData={data.charts.hasEssays}
          emptyDescription="Envie sua primeira redação para ver o detalhamento por competência."
        >
          <CompetenceList scores={data.charts.competenceScores} />
        </SectionCard>

        <SectionCard
          title="Evolução no Tempo"
          icon={TrendingUp}
          hasData={data.charts.hasHistory}
          emptyDescription="Seu gráfico de progresso será gerado automaticamente."
        >
          <EvolutionGraph data={data.charts.evolutionData} />
        </SectionCard>
      </div>

      <RecentEssaysList
        hasData={data.recentEssays.hasEssays}
        essays={data.recentEssays.list}
      />
    </div >
  );
}
import { CreditBalance } from "@/components/credit-balance";
import { StatCard } from "@/components/stat-card";
import { BookOpen, FileCheck, FileText, NotebookPen, TrendingUp } from "lucide-react";
import { SectionCard } from "@/components/section-card";
import { CompetenceList } from "@/components/competence-list";
import { EvolutionGraph } from "@/components/evolution-graph";
import { RecentEssaysList } from "@/components/recent-essays-list";
import { getStudentHistory, getStudentMetrics, getStudentProfile } from "@/app/actions/get-dashboard-data";
import { ActionCard } from "@/components/action-card";
import { createClient } from "@/lib/server";
import { redirect } from "next/navigation";
import { Skeleton } from "@repo/ui/components/skeleton";
import { Suspense } from "react";


export default async function DashboardPage() {

  const actions = [
    {
      title: "Nova Redação",
      description: "Escolha um tema ou envie um texto livre para correção imediata.",
      buttonText: "Começar Agora",
      icon: NotebookPen,
      variant: "default" as const,
      href: '/temas'
    },
    {
      title: "Temas Disponíveis",
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

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const [profileData, metrics, history] = await Promise.all([
    getStudentProfile(user.id),
    getStudentMetrics(user.id),
    getStudentHistory(user.id)
  ])

  return (
    <div className="space-y-8 min-h-screen px-4 md:px-10 lg:px-12 py-4">
      <Suspense fallback={
        <Skeleton className="h-12 w-full rounded-lg bg-slate-200" />
      }>
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex flex-col text-center md:text-left">
            <h1 className="text-3xl font-bold tracking-tight">
              Olá, {profileData.firstName}!
            </h1>
            <p className="text-slate-500 text-md mt-1">
              Vamos escrever sua próxima redação nota 1000?
            </p>
          </div>

          <CreditBalance amount={profileData.credits} />
        </div>
      </Suspense>


      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        {actions.map((action, index) => (
          <ActionCard key={index} {...action} />
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Suspense fallback={<Skeleton className="min-h-40 bg-slate-200 rounded-3xl" />}>
          <StatCard
            title="Média Geral"
            variant="yellow"
            value={metrics.averageScore}
            helperText="Sua média aparecerá aqui"
          />
        </Suspense>


        <Suspense fallback={<Skeleton className="min-h-40 bg-slate-200 rounded-3xl" />}>
          <StatCard
            title="Última Nota"
            variant="blue"
            value={metrics.lastScore}
            helperText="Sua nota aparecerá aqui"
          />
        </Suspense>

      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Suspense fallback={<Skeleton className="rounded-3xl min-h-[300px] bg-slate-200" />}>
          <SectionCard
            title="Média por Competência"
            icon={FileText}
            hasData={metrics.totalEssays > 0}
            emptyDescription="Envie sua primeira redação para ver o detalhamento por competência."
          >
            <CompetenceList scores={metrics.competenceScores} />
          </SectionCard>
        </Suspense>

        <Suspense fallback={<Skeleton className="rounded-3xl min-h-[300px] bg-slate-200" />}>
          <SectionCard
            title="Evolução no Tempo"
            icon={TrendingUp}
            hasData={history.hasHistory}
            emptyDescription="Seu gráfico de progresso será gerado automaticamente."
          >
            <EvolutionGraph data={history.evolutionData} />
          </SectionCard>
        </Suspense>
      </div>

      <Suspense fallback={
        <Skeleton className="rounded-3xl min-h-[250px] bg-slate-200" />}>
        <RecentEssaysList />
      </Suspense>

    </div >
  );
}
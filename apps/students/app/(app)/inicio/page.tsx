import { StatCard } from "@/components/stat-card";
import { BookOpen, FileCheck, FileText, NotebookPen, TrendingUp } from "lucide-react";
import { SectionCard } from "@/components/section-card";
import { CompetenceList } from "@/components/competence-list";
import { EvolutionGraph } from "@/components/evolution-graph";
import { RecentEssaysList } from "@/components/essays/recent-essays-list";
import { ActionCard } from "@/components/action-card";
import { redirect } from "next/navigation";
import { Skeleton } from "@repo/ui/components/skeleton";
import { Suspense } from "react";
import { getProfileData } from "@/app/actions/profile";
import { CreditsCard } from "@/components/credits-card";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Início",
};

const actions = [
  {
    title: "Nova Redação",
    description: "Escolha um tema e comece sua próxima redação.",
    buttonText: "Começar Agora",
    icon: NotebookPen,
    variant: "default" as const,
    opensTopicPicker: true,
  },
  {
    title: "Temas Disponíveis",
    description: "Explore centenas de propostas de redação nos moldes do ENEM.",
    buttonText: "Explorar Temas",
    icon: BookOpen,
    variant: "secondary" as const,
    href: "/temas",
  },
  {
    title: "Minhas Redações",
    description: "Acesse seus feedbacks detalhados e acompanhe suas notas.",
    buttonText: "Ver Histórico",
    icon: FileCheck,
    variant: "dark" as const,
    href: "/minhas-redacoes",
  },
];

export default async function DashboardPage() {
  const data = await getProfileData();

  if (!data) {
    redirect("/login");
  }
  const { user, credits, competencies, globalStats, evolution, hasData } = data;

  return (
    <div className="min-h-dvh space-y-8 px-2 py-4 md:px-10 lg:px-12">
      <Suspense fallback={<Skeleton className="h-12 w-full rounded-lg bg-slate-200" />}>
        <div className="flex flex-col justify-start gap-6 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-col text-left">
            <h1 className="text-3xl font-bold tracking-tight">Olá, {user.name}!</h1>
            <p className="mt-1 text-base text-slate-500">
              Vamos escrever sua próxima redação nota 1000?
            </p>
          </div>

          <div className="flex justify-center sm:justify-end">
            <CreditsCard credits={credits} />
          </div>
        </div>
      </Suspense>

      <div className="mb-12 grid grid-cols-1 gap-6 md:grid-cols-3">
        {actions.map((action, index) => (
          <ActionCard key={index} {...action} />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <Suspense fallback={<Skeleton className="min-h-40 rounded-3xl bg-slate-200" />}>
          <StatCard
            title="Média Geral"
            variant="yellow"
            value={globalStats.averageScore}
            helperText="Sua média aparecerá aqui"
          />
        </Suspense>

        <Suspense fallback={<Skeleton className="min-h-40 rounded-3xl bg-slate-200" />}>
          <StatCard
            title="Última Nota"
            variant="blue"
            value={globalStats.lastScore}
            helperText="Sua nota aparecerá aqui"
          />
        </Suspense>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <Suspense fallback={<Skeleton className="min-h-75 rounded-3xl bg-slate-200" />}>
          <SectionCard
            title="Média por Competência"
            icon={FileText}
            hasData={globalStats.totalEssays > 0}
            emptyDescription="Envie sua primeira redação para ver o detalhamento por competência."
          >
            <CompetenceList scores={competencies} />
          </SectionCard>
        </Suspense>

        <Suspense fallback={<Skeleton className="min-h-75 rounded-3xl bg-slate-200" />}>
          <SectionCard
            title="Evolução no Tempo"
            icon={TrendingUp}
            hasData={hasData}
            emptyDescription="Seu gráfico de progresso será gerado automaticamente."
          >
            <EvolutionGraph data={evolution} />
          </SectionCard>
        </Suspense>
      </div>

      <Suspense fallback={<Skeleton className="min-h-62.5 rounded-3xl bg-slate-200" />}>
        <RecentEssaysList />
      </Suspense>
    </div>
  );
}

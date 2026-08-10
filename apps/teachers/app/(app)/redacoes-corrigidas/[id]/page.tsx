
import { notFound } from "next/navigation";
import { getGradedEssay } from "@/app/actions/essays";
import EssayHeader from "@repo/ui/components/features/essays/components/essay-header";
import EssayContent from "@repo/ui/components/features/essays/components/essay-content";
import { EssayScoreCard, EssayCompetencies } from "@repo/ui/components/features/essays/components/essay-sidebar";
import type { Metadata } from "next";
import EssayImprovementPlan from "@repo/ui/components/features/essays/components/essay-improvement-plan";
import { EssayHighlightNavigationProvider } from "@repo/ui/components/features/essays/components/essay-highlight-navigation";

export const metadata: Metadata = {
  title: "Detalhes da Redação",
};

export default async function GradedEssayPage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params;
  const essay = await getGradedEssay(id);

  if (!essay) return notFound();

  const bestScores = Object.keys(essay.scores).filter(
    (key) => essay.scores[key as keyof typeof essay.scores] === 200
  );

  return (
    <div className="px-4 md:px-10 lg:px-12 py-4">

      <EssayHeader
        title={essay.title}
        date={essay.submittedAt}
        studentName={essay.studentName}
      />


      <EssayHighlightNavigationProvider>
        <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-5">
          <div className="space-y-8 lg:col-span-3">
            <EssayContent
              text={essay.text}
              highlights={essay.highlights}
              generalComment={essay.generalComment}
              bestScores={bestScores}
            />
          </div>

          <div className="space-y-6 lg:col-span-2">
            <EssayScoreCard
              totalScore={essay.totalScore}
            />

            <EssayCompetencies
              scores={essay.scores}
              comments={essay.comments}
              highlights={essay.highlights}
            />

            <EssayImprovementPlan
              mainBottleneck={essay.mainBottleneck}
              nextEssayPriorities={
                essay.nextEssayPriorities
              }
              rewriteTasks={essay.rewriteTasks}
            />
          </div>
        </div>
      </EssayHighlightNavigationProvider>
    </div>
  );
}

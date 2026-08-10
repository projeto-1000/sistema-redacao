import { getGradedEssay } from "@/app/actions/essays";
import EssayHeader from "@repo/ui/components/features/essays/components/essay-header";
import EssayContent from "@repo/ui/components/features/essays/components/essay-content";
import { EssayScoreCard, EssayCompetencies } from "@repo/ui/components/features/essays/components/essay-sidebar";
import EssayImprovementPlan from "@repo/ui/components/features/essays/components/essay-improvement-plan";
import { EssayHighlightNavigationProvider } from "@repo/ui/components/features/essays/components/essay-highlight-navigation";

export async function GradedEssayView({ essayId }: { essayId: string }) {
  const essay = await getGradedEssay(essayId);

  if (!essay) {
    return <div className="p-8 text-center text-slate-500">Redação não encontrada.</div>;
  }

  const bestScores = Object.keys(essay.scores).filter(
    (key) => essay.scores[key as keyof typeof essay.scores] === 200
  );

  return (
    <>
      <EssayHeader
        title={essay.title}
        date={essay.submission_date}
        studentName={essay.student_name}
        teacherName={essay.teacher_name}
      />

      <EssayHighlightNavigationProvider>
        <div className="mt-8 grid grid-cols-1 items-start gap-8 lg:grid-cols-5">
          <div className="space-y-8 lg:col-span-3">
            <EssayContent
              text={essay.content}
              highlights={essay.highlights ?? []}
              generalComment={essay.general_comment}
              bestScores={bestScores}
            />
          </div>

          <div className="space-y-6 lg:col-span-2">
            <EssayScoreCard
              totalScore={essay.total_score}
            />

            <EssayCompetencies
              scores={essay.scores}
              comments={essay.comments}
              highlights={essay.highlights ?? []}
            />

            <EssayImprovementPlan
              mainBottleneck={essay.main_bottleneck}
              nextEssayPriorities={
                essay.next_essay_priorities ?? []
              }
              rewriteTasks={
                essay.rewrite_tasks ?? []
              }
            />
          </div>
        </div>
      </EssayHighlightNavigationProvider>
    </>
  );
}

import { getGradedEssay } from "@/app/actions/essays";
import EssayHeader from "@repo/ui/components/features/essays/components/essay-header";
import EssayContent from "@repo/ui/components/features/essays/components/essay-content";
import { EssayScoreCard, EssayCompetencies } from "@repo/ui/components/features/essays/components/essay-sidebar";

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

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start mt-8">
        <EssayContent
          text={essay.content}
          highlights={essay.highlights}
          generalComment={essay.general_comment}
          bestScores={bestScores}
        />

        <div className="lg:col-span-2 space-y-6">
          <EssayScoreCard totalScore={essay.total_score} />
          <EssayCompetencies scores={essay.scores} comments={essay.comments} />
        </div>
      </div>
    </>
  );
}
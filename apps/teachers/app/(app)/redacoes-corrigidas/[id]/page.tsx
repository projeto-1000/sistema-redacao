
import { notFound } from "next/navigation";
import { getGradedEssay } from "@/app/actions/essays";
import EssayHeader from "@repo/ui/components/features/essays/components/essay-header";
import EssayContent from "@repo/ui/components/features/essays/components/essay-content";
import { EssayScoreCard, EssayCompetencies } from "@repo/ui/components/features/essays/components/essay-sidebar";
import type { Metadata } from "next";

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


      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">
        <EssayContent
          text={essay.text}
          highlights={essay.highlights}
          generalComment={essay.generalComment}
          bestScores={bestScores}
        />


        <div className="lg:col-span-2 space-y-6">
          <EssayScoreCard
            totalScore={essay.totalScore}
          />

          <EssayCompetencies
            scores={essay.scores}
            comments={essay.comments}
          />
        </div>

      </div>
    </div>
  );
}
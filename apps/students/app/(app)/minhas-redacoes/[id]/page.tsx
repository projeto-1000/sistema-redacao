import { getEssayById } from "@/app/actions/get-essays";
import EssayHeader from "@repo/ui/components/features/essays/components/essay-header";
import EssayContent from "@repo/ui/components/features/essays/components/essay-content";
import { EssayCompetencies, EssayScoreCard } from "@repo/ui/components/features/essays/components/essay-sidebar";
import { notFound } from "next/navigation";

export default async function EssayFeedbackPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const essay = await getEssayById(id)

  if (!essay) return notFound();

  const bestScores = Object.keys(essay.scores).filter(
    (key) => essay.scores[key as keyof typeof essay.scores] === 200
  );

  return (
    <div className="px-4 md:px-10 lg:px-12 py-4">

      <EssayHeader
        title={essay.title}
        date={essay.correctedAt}
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
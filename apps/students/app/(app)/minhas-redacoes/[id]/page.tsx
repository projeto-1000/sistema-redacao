import { getEssayById } from "@/app/actions/get-essays";
import EssayHeader from "@repo/ui/components/features/essays/components/essay-header";
import {
  EssayGeneralComment,
  EssayTextContent,
} from "@repo/ui/components/features/essays/components/essay-content";

import { EssayCompetencies, EssayScoreCard } from "@repo/ui/components/features/essays/components/essay-sidebar";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import ReturnedEssayCard from "@repo/ui/components/features/grading/components/returned-essay-card";
import EssayImprovementPlan from "@repo/ui/components/features/essays/components/essay-improvement-plan";
import { EssayHighlightNavigationProvider } from "@repo/ui/components/features/essays/components/essay-highlight-navigation";

export const metadata: Metadata = {
  title: "Detalhes da Redação",
};

export default async function EssayFeedbackPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const essay = await getEssayById(id)

  if (!essay) return notFound();

  const bestScores = Object.keys(essay.scores).filter(
    (key) => essay.scores[key as keyof typeof essay.scores] === 200
  );

  return (
    <div className="md:px-10 lg:px-12 py-4">

      <EssayHeader
        title={essay.title}
        date={essay.updatedAt}
        status={essay.status}
        className="mb-2 lg:mb-10"
      />


      <EssayHighlightNavigationProvider>
        <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-5">
          <div className="contents lg:col-span-3 lg:flex lg:flex-col lg:gap-8">
            <div className="order-2 lg:order-0">
              <EssayTextContent
                text={essay.text}
                highlights={essay.highlights}
                bestScores={bestScores}
              />
            </div>

            <div className="order-3 lg:order-0">
              <EssayGeneralComment generalComment={essay.generalComment} />
            </div>

            {essay.status === 'corrected' && (
              <div className="order-5 empty:hidden lg:order-0">
                <EssayImprovementPlan
                  mainBottleneck={essay.mainBottleneck}
                  nextEssayPriorities={
                    essay.nextEssayPriorities
                  }
                  rewriteTasks={essay.rewriteTasks}
                />
              </div>
            )}
          </div>

          <div className="contents lg:col-span-2 lg:flex lg:flex-col lg:gap-6">
            {essay.status === 'corrected' ? (
              <>
                <div className="order-1 lg:order-0">
                  <EssayScoreCard
                    totalScore={essay.totalScore}
                  />
                </div>

                <div className="order-4 lg:order-0">
                  <EssayCompetencies
                    scores={essay.scores}
                    comments={essay.comments}
                    highlights={essay.highlights}
                  />
                </div>

              </>
            ) : (
              <div className="order-1 lg:order-0">
                <ReturnedEssayCard
                  reason={essay.returnReason}
                  description={essay.returnDescription}
                />
              </div>
            )}
          </div>

        </div>
      </EssayHighlightNavigationProvider>
    </div>
  );
}


import { notFound } from "next/navigation";
import { getGradedEssay } from "@/app/actions/essays";
import EssayHeader from "@repo/ui/components/modules/essays/components/essay-header";
import EssayContent from "@repo/ui/components/modules/essays/components/essay-content";
import { EssayScoreCard, EssayCompetencies } from "@repo/ui/components/modules/essays/components/essay-sidebar";

export default async function GradedEssayPage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params;
  const essay = await getGradedEssay(id);

  if (!essay) return notFound();

  return (
    <div className="px-4 md:px-10 lg:px-12 py-4">
      <EssayHeader
        title={essay.title}
        date={essay.submittedAt}
        studentName={essay.studentName}
      />

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
        <EssayContent
          text={essay.text}
          highlights={essay.highlights}
          generalComment={essay.generalComment}
        />

        <div className="xl:col-span-5 space-y-6">
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
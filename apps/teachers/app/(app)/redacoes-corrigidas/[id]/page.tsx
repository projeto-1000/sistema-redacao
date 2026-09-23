
import { notFound } from "next/navigation";
import { getGradedEssay } from "@/app/actions/essays";
import EssayHeader from "@repo/ui/components/features/essays/components/essay-header";
import type { Metadata } from "next";
import { CorrectionReviewHistory } from "@repo/ui/components/features/essays/components/correction-review-history";
import type { CorrectionPayload } from "@repo/types";

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

  const publishedPayload: CorrectionPayload = {
    scores: essay.scores,
    comments: {
      c1: essay.comments.c1 ?? "",
      c2: essay.comments.c2 ?? "",
      c3: essay.comments.c3 ?? "",
      c4: essay.comments.c4 ?? "",
      c5: essay.comments.c5 ?? "",
    },
    general_comment: essay.generalComment ?? "",
    main_bottleneck: essay.mainBottleneck ?? "",
    next_essay_priorities: essay.nextEssayPriorities,
    rewrite_tasks: essay.rewriteTasks,
    highlights: essay.highlights,
  };

  return (
    <div className="px-4 md:px-10 lg:px-12 py-4">
      <EssayHeader
        title={essay.title}
        date={essay.submittedAt}
        studentName={essay.studentName}
      />

      <CorrectionReviewHistory
        audience="teacher"
        essayText={essay.text}
        publishedPayload={publishedPayload}
        rounds={essay.reviewHistory}
      />
    </div>
  );
}

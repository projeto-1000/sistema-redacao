import { getGradedEssay } from "@/app/actions/essays";
import EssayHeader from "@repo/ui/components/features/essays/components/essay-header";
import { CorrectionReviewHistory } from "@repo/ui/components/features/essays/components/correction-review-history";
import type { CorrectionPayload } from "@repo/types";

export async function GradedEssayView({ essayId }: { essayId: string }) {
  const essay = await getGradedEssay(essayId);

  if (!essay) {
    return <div className="p-8 text-center text-slate-500">Redação não encontrada.</div>;
  }

  const publishedPayload: CorrectionPayload = {
    scores: essay.scores,
    comments: {
      c1: essay.comments.c1 ?? "",
      c2: essay.comments.c2 ?? "",
      c3: essay.comments.c3 ?? "",
      c4: essay.comments.c4 ?? "",
      c5: essay.comments.c5 ?? "",
    },
    general_comment: essay.general_comment ?? "",
    main_bottleneck: essay.main_bottleneck ?? "",
    next_essay_priorities: essay.next_essay_priorities ?? [],
    rewrite_tasks: essay.rewrite_tasks ?? [],
    highlights: essay.highlights ?? [],
  };

  return (
    <>
      <EssayHeader
        title={essay.title}
        date={essay.submission_date}
        studentName={essay.student_name}
        teacherName={essay.teacher_name}
      />

      <CorrectionReviewHistory
        audience="admin"
        essayText={essay.content}
        publishedPayload={publishedPayload}
        rounds={essay.reviewHistory}
      />
    </>
  );
}

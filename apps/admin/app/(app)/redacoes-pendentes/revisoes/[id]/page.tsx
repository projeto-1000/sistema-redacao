import { getPendingCorrectionReview } from "@/app/actions/correction-reviews";
import { ApproveCorrectionReviewDialog } from "@/components/approve-correction-review-dialog";
import { EssayCorrectionWorkspace } from "@repo/ui/components/features/grading/components/essay-correction-workspace";
import { ArrowLeft, Clock, UserPen } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

function formatSubmittedAt(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "America/Sao_Paulo",
  }).format(new Date(value));
}

export default async function PendingCorrectionReviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const review = await getPendingCorrectionReview(id);

  if (!review) {
    notFound();
  }

  return (
    <div className="space-y-6 px-2 py-4 md:px-10 lg:px-12">
      <Link
        href="/redacoes-pendentes?tab=revisoes"
        className="flex w-fit items-center gap-2 text-sm font-medium text-slate-500 transition-colors hover:text-blue-600"
      >
        <ArrowLeft className="size-4" />
        Voltar para fila de revisões
      </Link>

      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-violet-200 bg-violet-50 px-5 py-4 text-sm text-violet-900">
        <span className="inline-flex items-center gap-1.5 font-bold">
          <UserPen className="size-4" />
          Professor: {review.teacher.name}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Clock className="size-4" />
          Enviada em {formatSubmittedAt(review.submittedAt)}
        </span>
        <span className="rounded-full border border-violet-300 bg-white px-3 py-1 text-xs font-bold uppercase tracking-wide text-violet-700">
          Aguardando revisão
        </span>
        <div className="ml-auto">
          <ApproveCorrectionReviewDialog submissionId={review.id} />
        </div>
      </div>

      <EssayCorrectionWorkspace
        essay={{
          id: review.essay.id,
          student: review.essay.studentName,
          title: review.essay.title,
          content: review.essay.content,
          created_at: review.essay.createdAt,
          status: review.essay.status,
        }}
        initialDraft={review.payload}
        redirectPath="/redacoes-pendentes?tab=revisoes"
        readOnly
      />
    </div>
  );
}

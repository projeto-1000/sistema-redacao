import { getPendingCorrectionReview } from "@/app/actions/correction-reviews";
import { CorrectionReviewWorkspace } from "@/components/correction-review-workspace";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

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

      <CorrectionReviewWorkspace review={review} />
    </div>
  );
}

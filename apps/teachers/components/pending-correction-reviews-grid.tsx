import { type getPendingTeacherCorrectionReviews } from "@/app/actions/essays";
import { CorrectionReviewTable } from "@repo/ui/components/features/essays/correction-review-table";
import { TablePagination } from "@repo/ui/components/table-pagination";
import { CircleAlert, ClipboardCheck } from "lucide-react";

interface PendingCorrectionReviewsGridProps {
  result: Awaited<ReturnType<typeof getPendingTeacherCorrectionReviews>>;
}

export default function PendingCorrectionReviewsGrid({
  result,
}: PendingCorrectionReviewsGridProps) {
  const { reviews, totalPages, error } = result;

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-slate-200 bg-slate-50/50 px-6 py-20 text-center">
        <CircleAlert className="mb-4 size-14 rounded-full bg-white p-1 text-red-500 shadow-sm" />
        <h3 className="mb-1 text-lg font-bold text-red-600">Ocorreu um erro.</h3>
        <p className="max-w-sm text-sm leading-relaxed text-slate-600">{error}</p>
      </div>
    );
  }

  if (reviews.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-slate-200 bg-slate-50/50 px-6 py-20 text-center">
        <div className="mb-4 rounded-full bg-white p-4 shadow-sm">
          <ClipboardCheck className="size-8 text-slate-300" />
        </div>
        <h3 className="mb-1 text-lg font-bold text-slate-800">
          Nenhuma correção aguardando revisão.
        </h3>
        <p className="max-w-sm text-sm leading-relaxed text-slate-600">
          As correções enviadas para análise do admin aparecerão aqui.
        </p>
      </div>
    );
  }

  return (
    <>
      <CorrectionReviewTable reviews={reviews} />
      <TablePagination totalPages={totalPages} />
    </>
  );
}

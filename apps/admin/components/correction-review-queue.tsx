import {
  type getPendingCorrectionReviews,
  type PendingCorrectionReviewListItem,
} from "@/app/actions/correction-reviews";
import { Button } from "@repo/ui/components/button";
import { TablePagination } from "@repo/ui/components/table-pagination";
import { CircleAlert, ClipboardCheck, Eye, Hourglass } from "lucide-react";
import Link from "next/link";

interface CorrectionReviewQueueProps {
  result: Awaited<ReturnType<typeof getPendingCorrectionReviews>>;
}

const CORRECTION_REVIEW_GRID =
  "grid-cols-1 gap-3 xl:grid-cols-[minmax(0,2fr)_minmax(0,3fr)_minmax(0,2fr)_minmax(12rem,1.5fr)_minmax(11rem,auto)] xl:gap-4";

function formatSubmittedAt(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "America/Sao_Paulo",
  }).format(new Date(value));
}

function CorrectionReviewRow({ review }: { review: PendingCorrectionReviewListItem }) {
  return (
    <div className={`grid ${CORRECTION_REVIEW_GRID} border-b border-slate-100 px-6 py-5 last:border-b-0 xl:items-center xl:px-8`}>
      <div className="min-w-0">
        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 xl:hidden">
          Aluno
        </span>
        <p className="truncate text-sm font-bold text-slate-800">{review.studentName}</p>
      </div>

      <div className="min-w-0">
        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 xl:hidden">
          Tema
        </span>
        <p className="line-clamp-2 text-sm font-medium text-slate-700" title={review.essayTitle}>
          {review.essayTitle}
        </p>
      </div>

      <div className="min-w-0">
        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 xl:hidden">
          Professor
        </span>
        <p className="truncate text-sm font-medium text-slate-700">{review.teacherName}</p>
      </div>

      <div className="min-w-48">
        <div className="inline-flex items-center gap-1.5 rounded-full border border-violet-200 bg-violet-50 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide text-violet-700">
          <Hourglass className="size-3" />
          Aguardando revisão
        </div>
        <p className="mt-1.5 text-xs text-slate-500">{formatSubmittedAt(review.submittedAt)}</p>
      </div>

      <div className="flex justify-end">
        <Button asChild variant="secondary" className="rounded-2xl font-bold">
          <Link href={`/redacoes-pendentes/revisoes/${review.id}`}>
            Revisar correção <Eye className="size-4" />
          </Link>
        </Button>
      </div>
    </div>
  );
}

export default function CorrectionReviewQueue({ result }: CorrectionReviewQueueProps) {
  const { reviews, totalPages, error } = result;

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-slate-200 bg-slate-100 px-6 py-20 text-center">
        <CircleAlert className="mb-4 size-14 rounded-full bg-white p-1 text-red-500 shadow-sm" />
        <h3 className="mb-1 text-lg font-bold text-red-600">Ocorreu um erro.</h3>
        <p className="max-w-sm text-sm leading-relaxed text-slate-600">{error}</p>
      </div>
    );
  }

  if (reviews.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-slate-200 bg-slate-100 px-6 py-20 text-center">
        <div className="mb-4 rounded-full bg-white p-4 shadow-sm">
          <ClipboardCheck className="size-8 text-slate-300" />
        </div>
        <h3 className="mb-1 text-lg font-bold text-slate-800">
          Nenhuma correção aguardando revisão no momento.
        </h3>
        <p className="max-w-sm text-sm leading-relaxed text-slate-600">
          As correções supervisionadas enviadas pelos professores aparecerão aqui.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="overflow-hidden rounded-4xl border border-slate-200 bg-white shadow-sm">
        <div className={`hidden ${CORRECTION_REVIEW_GRID} border-b border-slate-100 bg-slate-50/50 px-8 py-5 xl:grid`}>
          <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Aluno</div>
          <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Tema</div>
          <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
            Professor
          </div>
          <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
            Enviada em
          </div>
          <div className="text-right text-[10px] font-bold uppercase tracking-widest text-slate-400">
            Ação
          </div>
        </div>

        {reviews.map((review) => (
          <CorrectionReviewRow key={review.id} review={review} />
        ))}
      </div>

      <TablePagination totalPages={totalPages} />
    </>
  );
}

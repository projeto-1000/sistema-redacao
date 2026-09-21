import {
  type getPendingTeacherCorrectionReviews,
  type PendingTeacherCorrectionReviewListItem,
} from "@/app/actions/essays";
import type { DeadlineInfo } from "@repo/types";
import { Avatar } from "@repo/ui/components/avatar";
import { getDeadlineStatus } from "@repo/utils";
import { CircleAlert, ClipboardCheck, Clock, Hourglass } from "lucide-react";
import { TablePagination } from "./table-pagination";

interface PendingCorrectionReviewsGridProps {
  result: Awaited<ReturnType<typeof getPendingTeacherCorrectionReviews>>;
}

const PENDING_REVIEWS_GRID =
  "grid-cols-1 gap-3 xl:grid-cols-[minmax(0,2fr)_minmax(0,3fr)_minmax(9rem,1.25fr)_minmax(11rem,1.5fr)_minmax(11rem,1.5fr)] xl:gap-4";

function formatSubmittedAt(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "America/Sao_Paulo",
  }).format(new Date(value));
}

function DeadlineBadge({ review }: { review: PendingTeacherCorrectionReviewListItem }) {
  const deadline = getDeadlineStatus(
    review.dueDate,
    review.remainingBusinessSeconds
  ) as DeadlineInfo;
  let classes = "border-blue-500 bg-blue-100 text-blue-700";

  if (deadline.status === "urgent" || deadline.status === "expired") {
    classes = "border-red-500 bg-red-100 text-red-700";
  } else if (deadline.status === "warning") {
    classes = "border-amber-400 bg-amber-100 text-amber-700";
  }

  return (
    <div
      className={`inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-full border px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide ${classes}`}
      title={deadline.label}
    >
      <Clock className="size-3" />
      {deadline.text}
    </div>
  );
}

function PendingCorrectionReviewRow({
  review,
}: {
  review: PendingTeacherCorrectionReviewListItem;
}) {
  return (
    <div
      className={`grid ${PENDING_REVIEWS_GRID} border-b border-slate-100 px-6 py-5 last:border-b-0 xl:items-center xl:px-8`}
    >
      <div className="flex min-w-0 items-center gap-4">
        <Avatar
          src={review.studentAvatarUrl}
          name={review.studentName}
          className="size-9 shrink-0 rounded-full border border-slate-200"
        />
        <div className="min-w-0">
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 xl:hidden">
            Aluno
          </span>
          <p className="truncate text-sm font-bold text-slate-800">
            {review.studentName}
          </p>
        </div>
      </div>

      <div className="min-w-0">
        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 xl:hidden">
          Tema
        </span>
        <p
          className="line-clamp-2 text-sm font-medium text-slate-700"
          title={review.essayTitle}
        >
          {review.essayTitle}
        </p>
      </div>

      <div>
        <span className="mb-1 block text-[10px] font-bold uppercase tracking-widest text-slate-400 xl:hidden">
          Prazo
        </span>
        <DeadlineBadge review={review} />
      </div>

      <div>
        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 xl:hidden">
          Enviada em
        </span>
        <p className="text-sm text-slate-600">
          {formatSubmittedAt(review.submittedAt)}
        </p>
      </div>

      <div className="xl:justify-self-end">
        <div className="inline-flex items-center gap-1.5 rounded-full border border-violet-200 bg-violet-50 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide text-violet-700">
          <Hourglass className="size-3" />
          Aguardando revisão
        </div>
      </div>
    </div>
  );
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
      <div className="overflow-hidden rounded-4xl border border-slate-200 bg-white shadow-sm">
        <div
          className={`hidden ${PENDING_REVIEWS_GRID} border-b border-slate-100 bg-slate-50/50 px-8 py-5 xl:grid`}
        >
          <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
            Aluno
          </div>
          <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
            Tema da redação
          </div>
          <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
            Prazo
          </div>
          <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
            Enviada em
          </div>
          <div className="text-right text-[10px] font-bold uppercase tracking-widest text-slate-400">
            Status
          </div>
        </div>

        {reviews.map((review) => (
          <PendingCorrectionReviewRow key={review.id} review={review} />
        ))}
      </div>

      <TablePagination totalPages={totalPages} />
    </>
  );
}

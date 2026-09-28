import type { CorrectionReviewListItem } from "@repo/types";
import { Avatar } from "@repo/ui/components/avatar";
import { Button } from "@repo/ui/components/button";
import { formatDate } from "@repo/utils";
import { Eye, Hourglass } from "lucide-react";
import Link from "next/link";
import { EssayDeadlineBadge } from "./essay-deadline-badge";

export interface CorrectionReviewTableItem extends CorrectionReviewListItem {
  actionHref?: string;
}

interface CorrectionReviewTableProps {
  reviews: CorrectionReviewTableItem[];
  showTeacher?: boolean;
  actionLabel?: string;
}

const TEACHER_GRID =
  "lg:grid-cols-[minmax(0,2.2fr)_minmax(0,3.8fr)_minmax(0,1fr)_minmax(0,2.5fr)]";
const ADMIN_GRID =
  "lg:grid-cols-[minmax(0,1.1fr)_minmax(0,2fr)_minmax(0,1.2fr)_4.5rem_10.5rem_7rem] xl:grid-cols-[minmax(0,1.3fr)_minmax(0,2fr)_minmax(0,1.3fr)_minmax(0,0.8fr)_minmax(0,2.25fr)_minmax(0,2.25fr)]";

export function CorrectionReviewTable({
  reviews,
  showTeacher = false,
  actionLabel = "Revisar correção",
}: CorrectionReviewTableProps) {
  const grid = showTeacher ? ADMIN_GRID : TEACHER_GRID;
  const showAction = reviews.some((review) => Boolean(review.actionHref));
  const tableSpacing = showTeacher
    ? "lg:gap-3 lg:px-5 xl:gap-4 xl:px-8"
    : "lg:gap-4 lg:px-8";

  return (
    <div className="overflow-hidden rounded-4xl border border-slate-200 bg-white shadow-sm">
      <div
        className={`hidden ${grid} ${tableSpacing} border-b border-slate-100 bg-slate-50/50 py-5 lg:grid`}
      >
        <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
          Aluno
        </div>
        <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
          Tema da redação
        </div>
        {showTeacher && (
          <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
            Professor
          </div>
        )}
        <div className="text-center text-[10px] font-bold uppercase tracking-widest whitespace-nowrap text-slate-400">
          Prazo
        </div>
        <div className="text-right text-[10px] font-bold uppercase tracking-widest whitespace-nowrap text-slate-400">
          Status
        </div>
        {showAction && (
          <div className="text-right text-[10px] font-bold uppercase tracking-widest text-slate-400">
            Ação
          </div>
        )}
      </div>

      {reviews.map((review) => (
        <div
          key={review.id}
          className={`grid grid-cols-[minmax(0,1fr)_auto] gap-x-2 gap-y-3 border-b border-slate-100 px-6 py-5 last:border-b-0 lg:items-center ${tableSpacing} ${grid}`}
        >
          <div className="flex min-w-0 items-center gap-4">
            <Avatar
              src={review.studentAvatarUrl}
              name={review.studentName}
              className={`size-9 shrink-0 rounded-full border border-slate-200 ${showTeacher ? "lg:hidden xl:block" : ""}`}
            />
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-slate-800">
                {review.studentName}
              </p>
              <p className="text-xs text-slate-500">
                Data de envio: {formatDate(review.submittedAt, "numeric")}
              </p>
            </div>
          </div>

          <div className="col-span-2 min-w-0 lg:col-span-1">
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 lg:hidden">
              Tema
            </span>
            <p
              className="line-clamp-2 text-sm font-medium text-slate-700"
              title={review.essayTitle}
            >
              {review.essayTitle}
            </p>
          </div>

          {showTeacher && (
            <div className="col-span-2 min-w-0 lg:col-span-1">
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 lg:hidden">
                Professor
              </span>
              <p className="truncate text-sm font-medium text-slate-700">
                {review.teacherName}
              </p>
            </div>
          )}

          <div className="col-start-2 row-start-1 justify-self-end lg:col-start-auto lg:row-start-auto lg:justify-self-center">
            <EssayDeadlineBadge
              dueDate={review.dueDate}
              remainingBusinessSeconds={review.remainingBusinessSeconds}
            />
          </div>

          <div className="col-span-2 lg:col-span-1 lg:justify-self-end">
            <span className="mb-1 block text-[10px] font-bold uppercase tracking-widest text-slate-400 lg:hidden">
              Status
            </span>
            <div className="inline-flex items-center gap-1.5 rounded-full border border-violet-200 bg-violet-50 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide whitespace-nowrap text-violet-700">
              <Hourglass className="size-3" />
              Aguardando revisão
            </div>
          </div>

          {review.actionHref && (
            <div className="col-span-2 flex justify-end lg:col-span-1">
              <Button
                asChild
                variant="secondary"
                className="rounded-2xl font-bold"
              >
                <Link href={review.actionHref}>
                  <span className="lg:hidden">{actionLabel}</span>
                  <span className="hidden lg:inline xl:hidden">Revisar</span>
                  <span className="hidden xl:inline">{actionLabel}</span>
                  <Eye className="size-4" />
                </Link>
              </Button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

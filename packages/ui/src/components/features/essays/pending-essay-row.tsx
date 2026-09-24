import type { PendingEssayListItem } from "@repo/types";
import { Avatar } from "@repo/ui/components/avatar";
import { formatDate } from "@repo/utils";
import type { ReactNode } from "react";
import { EssayDeadlineBadge } from "./essay-deadline-badge";

export const PENDING_ESSAYS_TABLE_GRID =
  "lg:grid-cols-[minmax(0,2.2fr)_minmax(0,3.8fr)_minmax(5rem,auto)_minmax(11rem,auto)]";

interface PendingEssayRowProps {
  essay: PendingEssayListItem;
  action: ReactNode;
}

export function PendingEssayRow({ essay, action }: PendingEssayRowProps) {
  return (
    <div className="border-b border-slate-100 last:border-b-0">
      <div
        className={`group grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 px-8 py-5 transition-colors hover:bg-slate-50 lg:gap-4 ${PENDING_ESSAYS_TABLE_GRID}`}
      >
        <div className="flex min-w-0 items-center gap-4">
          <Avatar
            src={essay.avatar_url}
            name={essay.student_name}
            className="size-9 shrink-0 rounded-full border border-slate-200"
          />
          <div className="min-w-0">
            <h4 className="truncate text-sm font-bold leading-snug transition-colors group-hover:text-[#1E3A8A]">
              {essay.student_name}
            </h4>
            <span className="text-xs text-slate-500">
              Data de envio: {formatDate(essay.submission_date, "numeric")}
            </span>
          </div>
        </div>

        <div className="col-span-2 mt-2 min-w-0 lg:col-span-1 lg:mt-0">
          <span className="mb-1 block text-[10px] font-bold uppercase tracking-widest text-slate-400 lg:hidden">
            Tema
          </span>
          <p
            className="line-clamp-2 text-sm font-medium leading-snug"
            title={essay.title}
          >
            {essay.title}
          </p>
        </div>

        <div className="col-start-2 row-start-1 flex shrink-0 justify-end lg:col-start-auto lg:row-start-auto lg:justify-center">
          <EssayDeadlineBadge
            dueDate={essay.due_date}
            remainingBusinessSeconds={essay.essay_remaining_business_seconds}
          />
        </div>

        <div className="col-span-2 mt-2 flex min-w-0 justify-end lg:col-span-1 lg:mt-0">
          {action}
        </div>
      </div>
    </div>
  );
}

'use client'

import { deleteDraftEssay } from "@/app/actions/essay-drafts";
import { EssayListItem } from "@/types";
import { ThemeBadge } from "@repo/ui/components/theme-badge";
import { formatDate } from "@repo/utils";
import { Calendar1Icon } from "lucide-react";
import { toast } from "sonner";
import { useTransition } from "react";
import { ESSAY_STATUS_MAP } from "@repo/constants";

import { SubmittedActions } from "./submitted-actions";
import { DraftActions } from "./draft-actions";
interface EssayCardProps {
  essay: EssayListItem;
}

export function EssayCard({ essay }: EssayCardProps) {
  const [isPending, startTransition] = useTransition();

  const { label, textColor } = ESSAY_STATUS_MAP[essay.status] || ESSAY_STATUS_MAP.pending;

  const onConfirmDelete = (e: React.MouseEvent) => {
    e.preventDefault();

    startTransition(async () => {
      try {
        const result = await deleteDraftEssay(essay.id);

        if (result.success) {
          toast.success("Rascunho excluído com sucesso.");
        }
      } catch (error) {
        console.error("Falha ao excluir:", error);
        toast.error("Erro ao excluir rascunho. Tente novamente.");
      }
    });
  };

  return (
    <div className="flex flex-col p-6 rounded-3xl border border-border bg-white shadow-sm hover:shadow-md transition-shadow h-full">
      <div className="flex-1">
        <ThemeBadge
          value={essay.thematic_axis}
          className="inline-block px-2 py-1 text-[10px] font-bold uppercase tracking-widest mb-4"
        />

        <h3 className="font-bold text-lg leading-snug mb-2 line-clamp-2">
          {essay.title}
        </h3>
        <span className="text-xs font-medium text-slate-500 tracking-wide flex gap-2">
          <Calendar1Icon className="size-3.5" />  {formatDate(essay.submission_date, 'short')}
        </span>
      </div>

      <div className="h-px w-full bg-slate-100 my-4" />

      <div className="flex items-end justify-between mb-3">
        <div className="flex flex-col gap-1 ">
          <span className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-wider">
            Status
          </span>
          <span className={`text-sm font-bold ${textColor}`}>
            {label}
          </span>
        </div>

        {essay.status === 'corrected' && (
          <div className="flex flex-col items-end">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Nota Final
            </span>
            <span className='text-2xl font-extrabold text-foreground'>
              {essay.total_score}
            </span>
          </div>
        )}
      </div>

      {essay.status === "draft" ? (
        <DraftActions
          topicId={essay.topic_id}
          isPending={isPending}
          onConfirmDelete={onConfirmDelete}
        />
      ) : (
        <SubmittedActions
          status={essay.status}
          essayId={essay.id}
        />
      )}
    </div>
  );
}
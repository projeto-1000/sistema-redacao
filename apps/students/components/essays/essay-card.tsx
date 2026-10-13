"use client";

import { deleteDraftEssay } from "@/app/actions/essay-drafts";
import { ThemeBadge } from "@repo/ui/components/theme-badge";
import { formatDate } from "@repo/utils";
import { Calendar1Icon } from "lucide-react";
import { toast } from "sonner";
import { useTransition } from "react";
import { ESSAY_STATUS_MAP } from "@repo/constants";

import { SubmittedActions } from "./submitted-actions";
import { DraftActions } from "./draft-actions";
import { getEssayCardDate, type EssayCardListItem } from "@/utils/get-essay-card-date";
interface EssayCardProps {
  essay: EssayCardListItem;
}

export function EssayCard({ essay }: EssayCardProps) {
  const [isPending, startTransition] = useTransition();

  const { label, textColor } = ESSAY_STATUS_MAP[essay.status] || ESSAY_STATUS_MAP.pending;
  const cardDate = getEssayCardDate(essay);

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
    <div className="border-border flex h-full flex-col rounded-3xl border bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex-1">
        <ThemeBadge
          value={essay.thematic_axis}
          className="mb-4 inline-block px-2 py-1 text-[10px] font-bold tracking-widest uppercase"
        />

        <h3 className="mb-2 line-clamp-2 text-lg leading-snug font-bold">{essay.title}</h3>
        <span className="flex gap-2 text-xs font-medium tracking-wide text-slate-500">
          <Calendar1Icon className="size-3.5 shrink-0" />
          {cardDate.label}: {formatDate(cardDate.date, "short")}
        </span>
      </div>

      <div className="my-4 h-px w-full bg-slate-100" />

      <div className="mb-3 flex items-end justify-between">
        <div className="flex flex-col gap-1">
          <span className="text-muted-foreground/60 text-[10px] font-bold tracking-wider uppercase">
            Status
          </span>
          <span className={`text-sm font-bold ${textColor}`}>{label}</span>
        </div>

        {essay.status === "corrected" && (
          <div className="flex flex-col items-end">
            <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
              Nota Final
            </span>
            <span className="text-foreground text-2xl font-extrabold">{essay.total_score}</span>
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
        <SubmittedActions status={essay.status} essayId={essay.id} />
      )}
    </div>
  );
}

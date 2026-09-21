'use client'

import { startEssayCorrection } from "@/app/actions/essays";
import { DeadlineInfo, PendingEssayListItem } from "@repo/types";
import { Avatar } from "@repo/ui/components/avatar";
import { Button } from "@repo/ui/components/button"
import { formatDate, getDeadlineStatus } from "@repo/utils";
import { ArrowRight, Clock, Hourglass, RotateCcw } from "lucide-react"
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { PENDING_ESSAYS_TABLE_GRID } from "./pending-essays-table-layout";
interface PendingEssaysRowProps {
  essay: PendingEssayListItem;
}

export default function PendingEssaysRow({ essay }: PendingEssaysRowProps) {
  const [startingEssayId, setStartingEssayId] = useState<string | null>(null);
  const router = useRouter();

  const deadline = getDeadlineStatus(
    essay.due_date,
    essay.essay_remaining_business_seconds
  ) as DeadlineInfo;

  const renderStatusBadge = (deadline: DeadlineInfo) => {
    let classes = "border-blue-500 text-blue-700 bg-blue-100";

    if (deadline.status === 'urgent' || deadline.status === 'expired') {
      classes = "border-red-500 text-red-700 bg-red-100";
    } else if (deadline.status === 'warning') {
      classes = "border-amber-400 text-amber-700 bg-amber-100";
    }

    return (
      <div className={`
        inline-flex px-3 py-1.5 text-[10px] font-bold uppercase rounded-full border tracking-wide 
        whitespace-nowrap items-center justify-center gap-1.5 ${classes}
      `} title={deadline.label}>
        <Clock className="size-3" />
        {deadline.text}
      </div>
    );
  };

  const handleStartCorrection = async (essayId: string) => {
    if (startingEssayId) return;
    setStartingEssayId(essayId);

    if (essay.correction_review_status === "pending_review") {
      setStartingEssayId(null);
      return;
    }

    if (essay.correction_review_status === "returned_to_teacher") {
      router.push(`/corrigir-redacao/${essayId}`);
      return;
    }

    try {
      const result = await startEssayCorrection(essayId);

      if (result.success) {
        router.push(`/corrigir-redacao/${essayId}`);
      } else {
        toast.error(result.error || "A redação já foi assumida por outro corretor.");
        setStartingEssayId(null);
      }
    } catch {
      toast.error("Ocorreu um erro ao tentar iniciar a correção.");
      setStartingEssayId(null);
    }
  };


  return (
    <div className="divide-y divide-slate-100">
      <div
        key={essay.id}
        className={`group grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 px-8 py-5 transition-colors hover:bg-slate-50 lg:gap-4 ${PENDING_ESSAYS_TABLE_GRID}`}
      >
        <div className="flex min-w-0 items-center gap-4">
          <Avatar src={essay.avatar_url} name={essay.student_name} className="size-9 rounded-full shrink-0 border border-slate-200" />
          <div className="min-w-0">
            <h4 className="truncate font-bold text-sm leading-snug group-hover:text-[#1E3A8A] transition-colors">
              {essay.student_name}
            </h4>
            <span className="text-xs text-slate-500">
              Data de envio: {formatDate(essay.submission_date, 'numeric')}
            </span>
          </div>
        </div>

        <div className="col-span-2 mt-2 lg:col-span-1 lg:mt-0">
          <span className="lg:hidden text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">
            Tema
          </span>
          <p className="text-sm font-medium leading-snug line-clamp-2" title={essay.title}>
            {essay.title}
          </p>
        </div>

        <div className="col-start-2 row-start-1 flex justify-end lg:col-start-auto lg:row-start-auto lg:justify-center">
          {renderStatusBadge(deadline)}
        </div>

        <div className="col-span-2 flex justify-end lg:col-span-1">
          {essay.correction_review_status === "pending_review" ? (
            <div className="inline-flex items-center gap-1.5 rounded-full border border-violet-200 bg-violet-50 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide text-violet-700">
              <Hourglass className="size-3" />
              Aguardando revisão
            </div>
          ) : (
            <Button
              onClick={() => handleStartCorrection(essay.id)}
              disabled={startingEssayId === essay.id}
              className="rounded-2xl font-bold shadow-sm h-10 whitespace-nowrap md:whitespace-normal leading-normal transition-transform"
              variant={
                essay.correction_review_status === "returned_to_teacher"
                  ? "outline"
                  : essay.status === "pending"
                    ? "default"
                    : "secondary"
              }
              isLoading={startingEssayId === essay.id}
              loadingText="Iniciando..."
            >
              {essay.correction_review_status === "returned_to_teacher" ? (
                <>
                  Ajustar correção <RotateCcw className="size-4" />
                </>
              ) : essay.status === 'pending' ? (
                <>
                  Iniciar correção <ArrowRight className="size-4 ml-1" />
                </>
              ) : (
                <>
                  Terminar correção <Hourglass className="size-4" />
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

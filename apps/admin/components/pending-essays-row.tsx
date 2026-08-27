'use client'

import { startEssayCorrection } from "@/app/actions/essays"
import { DeadlineInfo, PendingEssayListItem } from "@repo/types"
import { Avatar } from "@repo/ui/components/avatar"
import { Button } from "@repo/ui/components/button"
import { formatDate, getDeadlineStatus } from "@repo/utils"
import { toast } from "sonner";
import { ArrowRight, Hourglass, Clock } from "lucide-react"
import { useRouter } from "next/navigation";
import { useState } from "react"

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

    try {
      const result = await startEssayCorrection(essayId);

      if (result.success) {
        router.push(`/corrigir-redacao/${essayId}`);
      } else {
        toast.error(result.error || "A redação já foi assumida por outro corretor.");
        setStartingEssayId(null);
      }
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      toast.error("Ocorreu um erro ao tentar iniciar a correção.");
      setStartingEssayId(null);
    }
  };

  return (
    <div className="divide-y divide-slate-100">
      <div
        key={essay.id}
        className="grid grid-cols-1 lg:grid-cols-12 gap-2 lg:gap-4 px-8 py-5 items-center hover:bg-slate-50 transition-colors group"
      >
        <div className="lg:col-span-3 flex items-center gap-4">
          <Avatar src={essay.avatar_url} name={essay.student_name} className="size-9 rounded-full shrink-0 border border-slate-200" />
          <div>
            <h4 className="font-bold text-sm leading-snug group-hover:text-[#1E3A8A] transition-colors">
              {essay.student_name}
            </h4>
            <span className="text-xs text-slate-500">
              Data de envio: {formatDate(essay.submission_date, 'numeric')}
            </span>
          </div>
        </div>

        <div className="lg:col-span-5 mt-2 lg:mt-0">
          <span className="lg:hidden text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">
            Tema
          </span>
          <p className="text-sm font-medium leading-snug line-clamp-2" title={essay.title}>
            {essay.title}
          </p>
        </div>

        <div className="lg:col-span-2 flex lg:justify-center">
          {renderStatusBadge(deadline)}
        </div>

        <div className="lg:col-span-2 flex justify-end">
          <Button
            onClick={() => handleStartCorrection(essay.id)}
            disabled={startingEssayId === essay.id}
            className="rounded-2xl font-bold shadow-sm h-10 whitespace-nowrap md:whitespace-normal leading-normal transition-transform"
            variant={essay.status === 'pending' ? 'default' : 'secondary'}
            isLoading={startingEssayId === essay.id}
            loadingText="Iniciando..."
          >
            {essay.status === 'pending' ? (
              <>
                Iniciar correção <ArrowRight className="size-4 ml-1" />
              </>
            ) : (
              <>
                Terminar correção <Hourglass className="size-4" />
              </>

            )}
          </Button>
        </div>
      </div>
    </div>
  )
}

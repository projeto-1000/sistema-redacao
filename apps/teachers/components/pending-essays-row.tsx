"use client";

import { startEssayCorrection } from "@/app/actions/essays";
import type { PendingEssayListItem } from "@repo/types";
import { Button } from "@repo/ui/components/button";
import { PendingEssayRow } from "@repo/ui/components/features/essays/pending-essay-row";
import { ArrowRight, Hourglass, RotateCcw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

interface PendingEssaysRowProps {
  essay: PendingEssayListItem;
}

export default function PendingEssaysRow({ essay }: PendingEssaysRowProps) {
  const [startingEssayId, setStartingEssayId] = useState<string | null>(null);
  const router = useRouter();

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

  const action =
    essay.correction_review_status === "pending_review" ? (
      <div className="inline-flex items-center gap-1.5 rounded-full border border-violet-200 bg-violet-50 px-3 py-1.5 text-[10px] font-bold tracking-wide text-violet-700 uppercase">
        <Hourglass className="size-3" />
        Aguardando revisão
      </div>
    ) : (
      <Button
        onClick={() => handleStartCorrection(essay.id)}
        disabled={startingEssayId === essay.id}
        className="h-10 rounded-2xl leading-normal font-bold whitespace-nowrap shadow-sm transition-transform md:whitespace-normal"
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
        ) : essay.status === "pending" ? (
          <>
            Iniciar correção <ArrowRight className="ml-1 size-4" />
          </>
        ) : (
          <>
            Terminar correção <Hourglass className="size-4" />
          </>
        )}
      </Button>
    );

  return <PendingEssayRow essay={essay} action={action} />;
}

"use client";

import { startEssayCorrection } from "@/app/actions/essays";
import type { PendingEssayListItem } from "@repo/types";
import { Button } from "@repo/ui/components/button";
import { PendingEssayRow } from "@repo/ui/components/features/essays/pending-essay-row";
import { ArrowRight, Hourglass } from "lucide-react";
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

  const action = (
    <Button
      onClick={() => handleStartCorrection(essay.id)}
      disabled={startingEssayId === essay.id}
      className="h-10 shrink-0 rounded-2xl leading-normal font-bold whitespace-nowrap shadow-sm transition-transform"
      variant={essay.status === "pending" ? "default" : "secondary"}
      isLoading={startingEssayId === essay.id}
      loadingText="Iniciando..."
    >
      {essay.status === "pending" ? (
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

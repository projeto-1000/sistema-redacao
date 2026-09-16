"use client";

import { startEssayCorrection } from "@/app/actions/essays";
import { Button } from "@repo/ui/components/button";
import { ArrowRight, Eye, Hourglass, RotateCcw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

interface StartEssayCorrectionButtonProps {
  essayId: string;
  isPending: boolean;
  reviewStatus?: "pending_review" | "returned_to_teacher" | null;
}

export function StartEssayCorrectionButton({
  essayId,
  isPending,
  reviewStatus,
}: StartEssayCorrectionButtonProps) {
  const router = useRouter();
  const [isStarting, setIsStarting] = useState(false);

  const handleStartCorrection = async () => {
    if (isStarting) return;

    setIsStarting(true);

    if (reviewStatus) {
      router.push(`/corrigir-redacao/${essayId}`);
      return;
    }

    try {
      const result = await startEssayCorrection(essayId);

      if (!result.success) {
        toast.error(result.error ?? "A redação já foi assumida por outro corretor.");
        setIsStarting(false);
        return;
      }

      router.push(`/corrigir-redacao/${essayId}`);
    } catch (error) {
      console.error("Erro ao iniciar correção:", error);
      toast.error("Ocorreu um erro ao tentar iniciar a correção.");
      setIsStarting(false);
    }
  };

  return (
    <Button
      type="button"
      variant={
        reviewStatus === "returned_to_teacher"
          ? "outline"
          : isPending
            ? "dark"
            : "secondary"
      }
      className="h-10 rounded-full text-sm font-bold"
      onClick={handleStartCorrection}
      disabled={isStarting}
      isLoading={isStarting}
      loadingText="Iniciando..."
    >
      {reviewStatus === "pending_review" ? (
        <>
          Visualizar correção <Eye className="size-4" />
        </>
      ) : reviewStatus === "returned_to_teacher" ? (
        <>
          Ajustar correção <RotateCcw className="size-4" />
        </>
      ) : isPending ? (
        <>
          Corrigir Agora <ArrowRight className="size-4" />
        </>
      ) : (
        <>
          Terminar correção <Hourglass className="size-4" />
        </>
      )}
    </Button>
  );
}

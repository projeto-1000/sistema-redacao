"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@repo/ui/components/button";
import { useGradingStore } from "@/stores/use-grading-store";
import { saveEssayCorrection } from "@/app/actions/essays";
import { CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";
interface StickyScoreProps {
  essayId: string;
}

export function StickyScore({ essayId }: StickyScoreProps) {
  const [isSaving, setIsSaving] = useState(false);
  const router = useRouter();

  const totalScore = useGradingStore((state) => state.getTotalScore());
  const canSave = useGradingStore((state) => state.canSave());

  const handleSave = async () => {
    if (!canSave || isSaving) return;

    setIsSaving(true);
    const state = useGradingStore.getState();

    try {

      const result = await saveEssayCorrection(essayId, {
        scores: state.scores,
        comments: state.comments,
        general_comment: state.generalComment,
        highlights: state.highlights
      });


      if (!result.success) {
        toast.error("Erro ao salvar correção.");
        setIsSaving(false);
        return;
      }

      router.push("/redacoes-corrigidas");

      toast.success("Redação corrigida com sucesso!", {
        duration: 5000,
        icon: <CheckCircle2 size={24} color="#00875a" />,
        style: {
          backgroundColor: '#f4faf8',
          borderRadius: '16px',
          padding: '24px',
          fontSize: '15px',
          gap: '16px',
          border: '1px solid rgba(0, 135, 90, 0.1)'
        }
      });

    } catch (err) {
      console.error("Save Error:", err);
      toast.error("Ocorreu um erro inesperado no servidor.");
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed lg:sticky bottom-6 right-6 lg:bottom-auto lg:top-6 lg:mt-[-120px] bg-white p-5 rounded-3xl shadow-2xl border border-slate-200 flex items-center justify-between gap-6 z-50 animate-in slide-in-from-bottom-10 lg:slide-in-from-right-10">
      <div>
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">
          Nota Total
        </span>
        <div className="flex items-baseline gap-1">
          <span className="text-4xl font-black tracking-tight">{totalScore}</span>
          <span className="text-lg font-bold text-slate-300">/ 1000</span>
        </div>
      </div>

      <Button
        onClick={handleSave}
        disabled={!canSave || isSaving}
        className="font-bold rounded-2xl px-6 h-12 transition-all shadow-lg shadow-amber-200"
      >
        {isSaving ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Salvando...
          </>
        ) : (
          "Salvar Correção"
        )}
      </Button>
    </div>
  );
}
"use client";

import { Button } from "@repo/ui/components/button";
import { useGradingStore } from "@/stores/use-grading-store";

interface StickyScoreProps {
  essayId: string;
}

export function StickyScore({ essayId }: StickyScoreProps) {
  const totalScore = useGradingStore((state) => state.getTotalScore());
  const canSave = useGradingStore((state) => state.canSave());

  const handleSave = () => {

    const payload = useGradingStore.getState();

    console.log("Enviando para o banco:", {
      total_score: payload.getTotalScore(),
      scores: payload.scores,
      comments: payload.comments,
      general_comment: payload.generalComment,
    });

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
        disabled={!canSave}
        className={`font-bold rounded-2xl px-6 h-12 transition-all ${canSave ? "shadow-lg shadow-amber-200" : "bg-slate-100 text-slate-400"
          }`}
      >
        Salvar Correção
      </Button>
    </div>
  );
}
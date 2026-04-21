"use client";

import { Button } from "@repo/ui/components/button";
import { Loader2 } from "lucide-react";

interface StickyScoreProps {
  totalScore: number;
  canSave: boolean;
  isSaving: boolean;
  onSave: () => void;
}

export function StickyScore({
  totalScore,
  canSave,
  isSaving,
  onSave
}: StickyScoreProps) {

  return (
    <div className="fixed bottom-6 left-4 right-4 md:left-auto md:right-6 lg:sticky lg:bottom-auto lg:top-6 lg:right-auto lg:mt-[-120px] bg-white p-5 rounded-3xl shadow-2xl border border-slate-200 flex items-center justify-between gap-6 z-50 animate-in slide-in-from-bottom-10 lg:slide-in-from-right-10">
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
        onClick={onSave}
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
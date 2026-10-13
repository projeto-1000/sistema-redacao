"use client";

import { Button } from "@repo/ui/components/button";
interface StickyScoreProps {
  totalScore: number;
  canSave: boolean;
  isSaving: boolean;
  onSave: () => void;
  readOnly?: boolean;
  saveButtonLabel?: string;
  savingLabel?: string;
}

export function StickyScore({
  totalScore,
  canSave,
  isSaving,
  onSave,
  readOnly = false,
  saveButtonLabel = "Enviar Correção",
  savingLabel = "Salvando...",
}: StickyScoreProps) {
  return (
    <div className="animate-in slide-in-from-bottom-10 lg:slide-in-from-right-10 fixed right-4 bottom-6 left-4 z-50 flex items-center justify-between gap-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-2xl md:right-6 md:left-auto lg:sticky lg:top-6 lg:right-auto lg:bottom-auto lg:mt-[-120px]">
      <div>
        <span className="mb-1 block text-[10px] font-bold tracking-widest text-slate-400 uppercase">
          Nota Total
        </span>
        <div className="flex items-baseline gap-1">
          <span className="text-3xl font-black tracking-tight md:text-4xl">{totalScore}</span>
          <span className="text-[18px] font-bold text-slate-300">/ 1000</span>
        </div>
      </div>

      {!readOnly && (
        <Button
          onClick={onSave}
          disabled={!canSave || isSaving}
          className="h-12 rounded-2xl px-6 font-bold shadow-lg transition-all"
          isLoading={isSaving}
          loadingText={savingLabel}
        >
          {saveButtonLabel}
        </Button>
      )}
    </div>
  );
}

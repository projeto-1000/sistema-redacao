"use client";

import { Button } from "@repo/ui/components/button";
import { Highlighter, CheckCircle2 } from "lucide-react";
import { COMPETENCY_STYLES, SCORE_LEVELS } from "../../constants";
import type { CorrectionHighlight } from "@repo/types";
import { HighlightCommentsPanel } from "./highlight-comments-panel";

interface CompetencyCardProps {
  comp: {
    id: string;
    title: string;
    description: string;
  };
  isActiveForHighlight: boolean;
  onActivateHighlightMode: (id: string) => void;
  score?: number;
  comment?: string;
  highlights: CorrectionHighlight[];
  activeHighlightId: string | null;
  onSelectHighlight: (id: string) => void;
  onScoreChange: (newScore: number) => void;
  onCommentChange: (newComment: string) => void;
}

export function CompetencyCard({
  comp,
  isActiveForHighlight,
  onActivateHighlightMode,
  score,
  comment,
  highlights,
  activeHighlightId,
  onSelectHighlight,
  onScoreChange,
  onCommentChange
}: CompetencyCardProps) {
  const compKey = comp.id.toLowerCase();
  const style = COMPETENCY_STYLES[compKey as keyof typeof COMPETENCY_STYLES];

  return (
    <div className={`
      bg-white p-6 rounded-3xl shadow-sm border transition-all duration-300
      ${isActiveForHighlight
        ? `ring-2 ${style.cardHighlight} shadow-lg scale-[1.02]`
        : `border-slate-200 border-l-4 ${style.border}`}
    `}>

      <div className="flex flex-col justify-between">
        <div className="flex w-full justify-between items-center mb-2">
          <h3 className="font-bold text-slate-800 leading-tight">
            {`${comp.id}: ${comp.title}`}
          </h3>
          <Button
            variant={isActiveForHighlight ? "default" : "outline"}
            size="sm"
            className={`
            ml-2 h-9 text-xs font-bold rounded-xl shrink-0 transition-all
            ${isActiveForHighlight
                ? `${style.btnHighlight} border-none shadow-md animate-pulse`
                : "border-slate-200 text-slate-600 hover:bg-slate-50"}
          `}
            onClick={() => onActivateHighlightMode(comp.id)}
          >
            {isActiveForHighlight ? (
              <>
                <CheckCircle2 className="size-3.5" />
                Selecionando...
              </>
            ) : (
              <>
                <Highlighter className="size-3.5 text-slate-400" />
                Destacar
              </>
            )}
          </Button>
        </div>
        <p className="text-sm text-slate-500 mb-5 leading-relaxed">
          {comp.description}
        </p>
      </div>

      <div className="grid grid-cols-3 md:grid-cols-6 gap-2 mb-4">
        {SCORE_LEVELS.map((level) => (
          <Button
            key={level}
            onClick={() => onScoreChange(level)}
            className={`
              w-full min-w-0 px-0 h-10 rounded-xl text-sm font-bold transition-all
              ${score === level
                ? "shadow-lg"
                : "bg-slate-50 text-slate-500 border border-slate-100 hover:bg-slate-100"}
            `}
          >
            {level}
          </Button>
        ))}
      </div>

      <textarea
        suppressHydrationWarning
        placeholder={`Justifique a pontuação da ${comp.id.toUpperCase()}...`}
        className="bg-slate-50 border-slate-200 rounded-xl resize-none w-full p-2 h-24 focus-visible:ring-amber-400/50 placeholder:text-slate-400"
        value={comment}
        onChange={(e) => onCommentChange(e.target.value)}
        maxLength={300}
      />

      <HighlightCommentsPanel
        highlights={highlights}
        activeHighlightId={activeHighlightId}
        onSelectHighlight={onSelectHighlight}
      />
    </div>
  );
}

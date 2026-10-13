"use client";

import { Button } from "@repo/ui/components/button";
import { Highlighter, CheckCircle2 } from "lucide-react";
import { COMPETENCY_STYLES, SCORE_LEVELS } from "../../constants";
import type { CorrectionHighlight } from "@repo/types";
import { CORRECTION_COMPETENCY_COMMENT_MAX_LENGTH } from "@repo/validators";
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
  commentError?: string;
  highlights: CorrectionHighlight[];
  activeHighlightId: string | null;
  onSelectHighlight: (id: string) => void;
  onScoreChange: (newScore: number) => void;
  onCommentChange: (newComment: string) => void;
  readOnly?: boolean;
}

export function CompetencyCard({
  comp,
  isActiveForHighlight,
  onActivateHighlightMode,
  score,
  comment,
  commentError,
  highlights,
  activeHighlightId,
  onSelectHighlight,
  onScoreChange,
  onCommentChange,
  readOnly = false,
}: CompetencyCardProps) {
  const compKey = comp.id.toLowerCase();
  const style = COMPETENCY_STYLES[compKey as keyof typeof COMPETENCY_STYLES];

  return (
    <div
      className={`rounded-3xl border bg-white p-6 shadow-sm transition-all duration-300 ${
        isActiveForHighlight
          ? `ring-2 ${style.cardHighlight} scale-[1.02] shadow-lg`
          : `border-l-4 border-slate-200 ${style.border}`
      } `}
    >
      <div className="flex flex-col justify-between">
        <div className="mb-2 flex w-full items-center justify-between">
          <h3 className="leading-tight font-bold text-slate-800">{`${comp.id}: ${comp.title}`}</h3>
          <Button
            variant={isActiveForHighlight ? "default" : "outline"}
            size="sm"
            className={`ml-2 h-9 shrink-0 rounded-xl text-xs font-bold transition-all ${
              isActiveForHighlight
                ? `${style.btnHighlight} animate-pulse border-none shadow-md`
                : "border-slate-200 text-slate-600 hover:bg-slate-50"
            } `}
            onClick={() => onActivateHighlightMode(comp.id)}
            disabled={readOnly}
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
        <p className="mb-5 text-sm leading-relaxed text-slate-500">{comp.description}</p>
      </div>

      <div className="mb-4 grid grid-cols-3 gap-2 md:grid-cols-6">
        {SCORE_LEVELS.map((level) => (
          <Button
            key={level}
            onClick={() => onScoreChange(level)}
            disabled={readOnly}
            className={`h-10 w-full min-w-0 rounded-xl px-0 text-sm font-bold transition-all ${
              score === level
                ? "shadow-lg"
                : "border border-slate-100 bg-slate-50 text-slate-500 hover:bg-slate-100"
            } `}
          >
            {level}
          </Button>
        ))}
      </div>

      <textarea
        suppressHydrationWarning
        placeholder={`Justifique a pontuação da ${comp.id.toUpperCase()}...`}
        aria-invalid={Boolean(commentError)}
        className={`h-24 w-full resize-none rounded-xl border bg-slate-50 p-2 placeholder:text-slate-400 focus-visible:ring-amber-400/50 ${
          commentError ? "border-red-400" : "border-slate-200"
        }`}
        value={comment}
        readOnly={readOnly}
        onChange={(e) => onCommentChange(e.target.value)}
        maxLength={CORRECTION_COMPETENCY_COMMENT_MAX_LENGTH}
      />

      {commentError && (
        <p className="mt-1.5 text-xs font-medium text-red-600" role="alert">
          {commentError}
        </p>
      )}

      <HighlightCommentsPanel
        highlights={highlights}
        activeHighlightId={activeHighlightId}
        onSelectHighlight={onSelectHighlight}
      />
    </div>
  );
}

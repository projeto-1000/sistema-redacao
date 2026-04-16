"use client";

import { Button } from "@repo/ui/components/button";
import { useGradingStore } from "@/stores/use-grading-store";
import { Highlighter, CheckCircle2 } from "lucide-react";

const SCORE_LEVELS = [0, 40, 80, 120, 160, 200];

const COMPETENCY_STYLES = {
  c1: { border: "border-l-comp-1", activeBg: "bg-comp-1/5", cardHighlight: 'ring-comp-1 border-comp-1', btnHighlight: 'bg-comp-1 hover:bg-comp-1/70 text-white' },
  c2: { border: "border-l-comp-2", activeBg: "bg-comp-2/5", cardHighlight: 'ring-comp-2 border-comp-2', btnHighlight: 'bg-comp-2 hover:bg-comp-2/70 text-white' },
  c3: { border: "border-l-comp-3", activeBg: "bg-comp-3/5", cardHighlight: 'ring-comp-3 border-comp-3', btnHighlight: 'bg-comp-3 hover:bg-comp-3/70 text-white' },
  c4: { border: "border-l-comp-4", activeBg: "bg-comp-4/5", cardHighlight: 'ring-comp-4 border-comp-4', btnHighlight: 'bg-comp-4 hover:bg-comp-4/70 text-white' },
  c5: { border: "border-l-comp-5", activeBg: "bg-comp-5/5", cardHighlight: 'ring-comp-5 border-comp-5', btnHighlight: 'bg-comp-5 hover:bg-comp-5/70 text-white' },
};

interface CompetencyCardProps {
  comp: {
    id: string;
    title: string;
    description: string;
  };
  isActiveForHighlight: boolean;
  onActivateHighlightMode: (id: string) => void;
}

export function CompetencyCard({
  comp,
  isActiveForHighlight,
  onActivateHighlightMode
}: CompetencyCardProps) {
  const compKey = comp.id.toLowerCase();

  const score = useGradingStore((state) => state.scores[compKey]);
  const comment = useGradingStore((state) => state.comments[compKey]);
  const setScore = useGradingStore((state) => state.setScore);
  const setComment = useGradingStore((state) => state.setComment);

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
            onClick={() => setScore(compKey, level)}
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
        onChange={(e) => setComment(compKey, e.target.value)}
        maxLength={300}
      />
    </div>
  );
}
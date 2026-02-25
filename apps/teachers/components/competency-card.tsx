"use client";

import { Button } from "@repo/ui/components/button";
import { Textarea } from "@repo/ui/components/textarea";
import { useGradingStore } from "@/stores/use-grading-store";

const SCORE_LEVELS = [0, 40, 80, 120, 160, 200];

const COMPETENCY_STYLES = {
  c1: { border: "border-l-comp-1" },
  c2: { border: "border-l-comp-2" },
  c3: { border: "border-l-comp-3" },
  c4: { border: "border-l-comp-4" },
  c5: { border: "border-l-comp-5" },
};

interface CompetencyCardProps {
  comp: {
    id: string;
    title: string;
    description: string;
  };
}

export function CompetencyCard({ comp }: CompetencyCardProps) {
  const score = useGradingStore((state) => state.scores[comp.id.toLowerCase()]);
  const comment = useGradingStore((state) => state.comments[comp.id.toLowerCase()]);

  const setScore = useGradingStore((state) => state.setScore);
  const setComment = useGradingStore((state) => state.setComment);

  const style = COMPETENCY_STYLES[comp.id.toLowerCase() as keyof typeof COMPETENCY_STYLES];

  return (
    <div className={`bg-white p-6 rounded-3xl shadow-sm border border-slate-200 border-l-[6px] ${style.border} transition-all`}>
      <h3 className="font-bold">{`${comp.id}: ${comp.title}`}</h3>
      <p className="text-sm text-slate-500 mb-5">{comp.description}</p>

      <div className="flex flex-wrap gap-2 mb-4">
        {SCORE_LEVELS.map((level) => (
          <Button
            key={level}
            onClick={() => setScore(comp.id.toLowerCase(), level)}
            className={`flex-1 min-w-12 py-2 rounded-xl text-sm font-bold transition-all ${score === level
              ? "scale-105 bg-amber-400 text-slate-900 shadow-md shadow-amber-200/50"
              : "bg-slate-50 text-slate-500 border border-slate-200 hover:bg-slate-100"
              }`}
          >
            {level}
          </Button>
        ))}
      </div>

      <Textarea
        placeholder={`Justifique a pontuação da ${comp.id.toUpperCase()}...`}
        className="bg-slate-50 border-slate-200 rounded-xl resize-none h-24 focus-visible:ring-amber-400/50 placeholder:text-slate-400"
        value={comment}
        onChange={(e) => setComment(comp.id.toLowerCase(), e.target.value)}
      />
    </div>
  );
}
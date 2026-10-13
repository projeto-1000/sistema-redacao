"use client";

import { COMPETENCIES } from "@repo/constants";
interface CompetenceListProps {
  scores: Record<string, number>;
}

export function CompetenceList({ scores }: CompetenceListProps) {
  return (
    <div className="w-full space-y-5">
      {COMPETENCIES.map((item) => {
        const score = scores[item.id] || 0;
        const max = 200;
        const percentage = (score / max) * 100;

        return (
          <div key={item.id} className="flex flex-col gap-1.5">
            <div className="flex min-w-max justify-between gap-2 text-sm md:items-center">
              <span className="text-foreground/80 font-bold">
                <strong className="text-foreground mr-1.5 font-extrabold">{item.id}:</strong>
                {item.title}
              </span>

              <span className="font-bold md:w-min lg:w-max">
                <span className="text-primary">{score}</span>
                <span className="text-muted-foreground/60 ml-0.5 text-xs">/ {max}</span>
              </span>
            </div>

            <div className="h-3 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                className="bg-primary h-full rounded-full transition-all duration-1000"
                style={{ width: `${percentage}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

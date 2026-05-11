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
            <div className="flex justify-between md:items-center min-w-max text-sm gap-2">
              <span className="font-bold text-foreground/80">
                <strong className="text-foreground font-extrabold mr-1.5">
                  {item.id}:
                </strong>
                {item.title}
              </span>

              <span className="font-bold md:w-min lg:w-max">
                <span className="text-primary">
                  {score}
                </span>
                <span className="text-muted-foreground/60 text-xs ml-0.5">
                  / {max}
                </span>
              </span>
            </div>

            <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-1000 bg-primary"
                style={{ width: `${percentage}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
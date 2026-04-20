import { ChartNoAxesColumn, Star } from "lucide-react";
import { COMPETENCY_INFO } from "../constants";
import { EssayCompetenciesProps } from "../types";

export function EssayScoreCard({ totalScore }: { totalScore: number }) {
  return (
    <div className="bg-[#0F172A] rounded-3xl p-8 text-white shadow-lg relative overflow-hidden">
      <div className="absolute top-0 right-0 p-6 opacity-10">
        <Star className="size-20" />
      </div>
      <p className="text-[12px] font-bold text-slate-400 uppercase tracking-widest mb-1">
        Nota total
      </p>
      <div className="flex items-baseline gap-1">
        <span className="text-5xl font-extrabold text-[#EBC84C]">{totalScore}</span>
        <span className="text-xl text-slate-400 font-medium">/ 1000</span>
      </div>
    </div>
  );
}

export function EssayCompetencies({ scores, comments }: EssayCompetenciesProps) {
  return (
    <div className="bg-white rounded-4xl p-8 shadow-sm border border-slate-200">
      <h3 className="font-bold mb-6 flex items-center gap-2">
        <ChartNoAxesColumn className="size-5 text-primary" />
        Desempenho por Competência
      </h3>

      <div className="space-y-6">
        {COMPETENCY_INFO.map((comp) => {
          const score = scores[comp.id as keyof typeof scores];
          const comment = comments[comp.id as keyof typeof comments];

          return (
            <div key={comp.id} className="group">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h4 className="font-bold text-sm">{comp.title}</h4>
                  <p className="text-[12px] text-slate-500 mt-0.5">{comp.desc}</p>
                </div>
                <div className={`font-black text-sm px-2 py-1 rounded-md ${comp.bg} ${comp.text}`}>
                  {score}<span className="opacity-50 font-bold">/200</span>
                </div>
              </div>
              <div className={`mt-3 border-l-3 ${comp.border} pl-4 py-1 text-sm text-slate-700 italic`}>
                {comment}
              </div>
              {comp.id !== "c5" && <div className="h-px w-full bg-slate-100 mt-6"></div>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

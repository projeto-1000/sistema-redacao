"use client";

import { useState, useEffect } from "react";
import { Zap, Clock } from "lucide-react";
import { AverageTimeRange } from "@/types";
import { getAverageTime } from "@/app/actions/teachers";

interface AverageTimeCardProps {
  teacherId: string;
}

export default function AverageTimeCard({ teacherId }: AverageTimeCardProps) {
  const [timeRange, setTimeRange] = useState<AverageTimeRange>("current_month");
  const [avgTime, setAvgTime] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTime() {
      setLoading(true);
      const time = await getAverageTime(teacherId, timeRange);
      setAvgTime(time);
      setLoading(false);
    }
    fetchTime();
  }, [timeRange, teacherId]);

  return (
    <div className="bg-white border border-slate-200 rounded-4xl p-6 md:p-8 shadow-sm flex flex-col justify-between h-full min-h-[380px]">
      <div className="flex items-start justify-between mb-8">
        <div>
          <h3 className="text-sm font-black uppercase tracking-wide">
            Tempo médio de correção
          </h3>
          <p className="text-[10px] font-bold text-slate-400 mt-0.5">
            Média por redação no período
          </p>
        </div>

        {/* Filtros */}
        <div className="flex items-center bg-slate-100 p-1 rounded-full shrink-0 border border-slate-200 shadow-inner">
          {[
            { value: "current_month", label: "Mês Atual" },
            { value: "30d", label: "30d" },
            { value: "60d", label: "60d" },
            { value: "90d", label: "90d" }
          ].map((filter) => (
            <button
              key={filter.value}
              onClick={() => setTimeRange(filter.value as AverageTimeRange)}
              className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider transition-all duration-300 ${timeRange === filter.value
                ? "bg-white text-blue-600 shadow-md"
                : "text-slate-500 hover:text-slate-700"
                }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col items-center justify-center flex-1">
        <div className="relative">
          {/* Fallback de Carregamento */}
          {loading ? (
            <div className="flex flex-col items-center">
              <div className="h-20 w-36 bg-slate-100 animate-pulse rounded-2xl" />
            </div>
          ) : avgTime === null || avgTime === 0 ? (
            /* ARQUITETURA: Empty State isolado no componente */
            <div className="flex flex-col items-center text-center max-w-[200px]">
              <Clock className="size-8 text-slate-200 mb-3" />
              <p className="text-sm font-bold text-slate-400">Nenhuma redação corrigida neste período.</p>
            </div>
          ) : (
            /* Estado de Sucesso */
            <>
              <div className="absolute inset-0 bg-blue-50 rounded-full scale-[1.8] blur-2xl opacity-60" />
              <div className="relative flex flex-col items-center">
                <span className="text-[5rem] leading-none font-black tracking-tighter">
                  {avgTime}
                  <span className="text-2xl ml-1 font-bold text-slate-300 tracking-normal">min</span>
                </span>

                <div className="mt-6 flex items-center gap-2 bg-emerald-50 text-emerald-600 px-4 py-2.5 rounded-2xl border border-emerald-100 shadow-sm">
                  <Zap className="size-4 fill-emerald-600" />
                  <span className="text-[10px] font-black uppercase tracking-widest">
                    {avgTime < 15 ? 'Leitura Rápida' : avgTime > 30 ? 'Leitura Detalhada' : 'Ritmo Padrão'}
                  </span>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
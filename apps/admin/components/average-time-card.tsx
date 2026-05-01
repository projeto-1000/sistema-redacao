"use client";

import { useState, useEffect } from "react";
import { Zap, AlertCircle, History } from "lucide-react";
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


  const renderContent = () => {
    if (loading) {
      return <div className="h-full w-full bg-slate-100 animate-pulse rounded-3xl" />;
    }

    if (avgTime === null) {
      return (
        <div className="flex flex-col justify-between items-center text-center p-6">
          <div className="size-10 rounded-full bg-red-100/50 text-red-600 flex items-center justify-center mb-4">
            <AlertCircle className="size-6" />
          </div>
          <h3 className="text-xs font-black text-red-800 uppercase tracking-widest mb-2">
            Erro ao carregar tempo médio
          </h3>
          <p className="text-slate-700 text-sm max-w-xs">
            Falha ao buscar o tempo médio das correções do professor.
          </p>
        </div>
      );
    }

    if (avgTime === 0) {
      return (
        <div className="flex flex-col items-center justify-center text-center bg-slate-50/50 border-2 border-dashed border-slate-200 rounded-3xl p-8 w-full h-full min-h-[220px] transition-all">
          <div className="size-12 rounded-full bg-slate-100 flex items-center justify-center mb-4">
            <History className="size-6 text-slate-400" />
          </div>
          <h3 className="text-[11px] font-black text-slate-500 uppercase tracking-widest mb-2">
            Sem atividade no período
          </h3>
          <p className="text-slate-400 text-xs max-w-[180px] font-medium leading-relaxed">
            Não identificamos correções finalizadas para o período selecionado.
          </p>
        </div>
      );
    }

    return (
      <div className="relative flex flex-col items-center">
        <div className="absolute inset-0 bg-blue-50 rounded-full scale-[1.8] blur-2xl opacity-60" />
        <div className="relative flex flex-col items-center">
          <span className="text-[5rem] leading-none font-black tracking-tighter">
            {avgTime}
            <span className="text-2xl ml-1 font-bold text-slate-300">min</span>
          </span>
          <div className="mt-6 flex items-center gap-2 bg-emerald-50 text-emerald-600 px-4 py-2.5 rounded-2xl border border-emerald-100">
            <Zap className="size-4 fill-emerald-600" />
            <span className="text-[10px] font-black uppercase tracking-widest">
              {avgTime < 15 ? 'Leitura Rápida' : avgTime > 30 ? 'Leitura Detalhada' : 'Ritmo Padrão'}
            </span>
          </div>
        </div>
      </div>
    );
  };

  const isError = avgTime === null && !loading;

  return (
    <div className="bg-white border border-slate-200 rounded-4xl p-6 md:p-8 shadow-sm flex flex-col h-full min-h-[380px]">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h3 className="text-sm font-black uppercase tracking-wide">Tempo médio</h3>
          <p className="text-[10px] font-bold text-slate-400 mt-0.5">Média por redação</p>
        </div>

        <div className="flex items-center bg-slate-100 p-1 rounded-full shrink-0 border border-slate-200 shadow-inner">
          {["current_month", "30d", "60d", "90d"].map((val) => (
            <button
              key={val}
              disabled={loading || isError}
              onClick={() => setTimeRange(val as AverageTimeRange)}
              className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed ${timeRange === val ? "bg-white text-blue-600 shadow-md" : "text-slate-500 hover:text-slate-700"
                }`}
            >
              {val === "current_month" ? "Mês Atual" : val}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center">
        {renderContent()}
      </div>
    </div>
  );
}